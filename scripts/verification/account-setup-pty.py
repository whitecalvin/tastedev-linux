"""Verify the real first-account CLI in a disposable private auth directory."""
import hashlib, json, os, pathlib, pty, secrets, select, shutil, subprocess, tempfile, time

project = pathlib.Path(__file__).resolve().parents[2]
node = os.environ.get('LINUX_VERIFY_NODE', '/usr/bin/node')
root = pathlib.Path(tempfile.mkdtemp(prefix='tastedev-account-setup-'))
env = {k:v for k,v in os.environ.items() if not k.startswith('LINUX_LOGIN_')}
env.update(LINUX_PACKAGED='true', LINUX_AUTH_ROOT=str(root), LINUX_STATE_ROOT=str(root))
password = secrets.token_urlsafe(32)

def setup(confirmation):
    master, slave = pty.openpty()
    child = subprocess.Popen([node, str(project/'scripts/setup-admin.mjs')], cwd=project,
                             env=env, stdin=slave, stdout=slave, stderr=slave)
    os.close(slave)
    output = bytearray()
    steps = [('관리자 사용자명:', 'setup-fixture'),
             ('비밀번호 (12~256자, 입력 숨김):', password),
             ('비밀번호 확인:', confirmation)]
    next_step = 0
    deadline = time.monotonic()+20
    try:
        while time.monotonic()<deadline:
            if select.select([master], [], [], .1)[0]:
                try: data = os.read(master, 65536)
                except OSError: break
                if not data: break
                output.extend(data)
                if next_step<len(steps) and steps[next_step][0] in output.decode('utf8', errors='replace'):
                    os.write(master, (steps[next_step][1]+'\n').encode())
                    next_step+=1
            if child.poll() is not None: break
        child.wait(timeout=3)
        assert next_step==3, 'CLI did not request all account fields'
        text=output.decode('utf8', errors='replace')
        assert password not in text and confirmation not in text, 'Password was echoed'
        return child.returncode, text
    finally:
        if child.poll() is None: child.kill(); child.wait()
        os.close(master)

try:
    code, output = setup(secrets.token_urlsafe(32))
    assert code==1 and '비밀번호가 일치하지 않습니다.' in output
    assert not (root/'auth.json').exists(), 'Mismatch must not create an account'
    code, output = setup(password)
    assert code==0 and '관리자 계정을 저장했습니다.' in output
    assert (root/'auth.json').stat().st_mode & 0o777 == 0o600
    check = '''
import assert from 'node:assert/strict';
let input='';for await (const chunk of process.stdin)input+=chunk;
const {password}=JSON.parse(input);
const {loginConfigured,login,cookieSession,sessionCookie,logoutSession}=await import('./lib/auth.mjs');
assert(loginConfigured());
await assert.rejects(login('setup-fixture',password+'incorrect'),e=>e.status===401);
const token=await login('setup-fixture',password);
const request=new Request('http://127.0.0.1:8791/',{headers:{cookie:sessionCookie(new Request('http://127.0.0.1:8791/'),token)}});
assert.equal((await cookieSession(request)).username,'setup-fixture');
await logoutSession(request);assert.equal(await cookieSession(request),null);
console.log(JSON.stringify({login:true,wrongPasswordRejected:true,logoutRevoked:true}));
'''
    result=subprocess.run([node,'--input-type=module','-e',check],cwd=project,env=env,
                          input=json.dumps({'password':password}),text=True,capture_output=True,timeout=25)
    assert result.returncode==0, 'Created-account authentication failed'
    auth=json.loads(result.stdout.strip().splitlines()[-1])
    evidence=project/'.runtime/verification/account-setup-pty-current-20261010.json'
    files=['scripts/setup-admin.mjs','lib/auth.mjs','lib/auth-store.mjs','lib/better-auth.mjs','lib/auth-password.mjs']
    evidence.write_text(json.dumps({'status':'PASS_REAL_ACCOUNT_CLI_SCOPE','hiddenPasswordInput':True,
      'mismatchCreatesNoAccount':True,'privateAccountFile':True,'authentication':auth,
      'sourceSha256':{f:hashlib.sha256((project/f).read_bytes()).hexdigest() for f in files},
      'existingAccountChanged':False,'fixtureRemoved':False,'wholeProductComplete':False},indent=2)+'\n')
finally:
    shutil.rmtree(root)
proof=json.loads(evidence.read_text());proof['fixtureRemoved']=True
evidence.write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps({'status':'PASS_REAL_ACCOUNT_CLI_SCOPE','evidence':str(evidence)}))
