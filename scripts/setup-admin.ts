import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { passwordHash, loginConfigured } from '../lib/auth.ts';
import { storeCredentials } from '../lib/auth-store.ts';
import nextEnv from '@next/env';
if (process.env.LINUX_PACKAGED !== 'true')
  nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production', {
    info: () => {},
    error: () => console.error('환경 설정 파일을 확인하세요.'),
  });
const command = process.env.LINUX_PACKAGED === 'true' ? 'sudo tastedev-linux account setup' : 'npm run account:setup';
if (!process.stdin.isTTY) {
  console.error('대화형 터미널에서 ' + command + '을 실행하세요.');
  process.exit(1);
}
if (!process.argv.includes('--replace') && loginConfigured()) {
  console.error(
    '이미 계정이 설정되어 있습니다. 재설정하려면 ' +
      command +
      (process.env.LINUX_PACKAGED === 'true' ? ' --replace' : ' -- --replace') +
      '를 실행하세요.',
  );
  process.exit(1);
}
let muted = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) process.stdout.write(chunk);
    callback();
  },
});
const prompt = createInterface({ input: process.stdin, output, terminal: true });
try {
  const username = await prompt.question('관리자 사용자명: ');
  process.stdout.write('비밀번호 (12~256자, 입력 숨김): ');
  muted = true;
  let password = await prompt.question('');
  muted = false;
  process.stdout.write('\n비밀번호 확인: ');
  muted = true;
  let confirmation = await prompt.question('');
  muted = false;
  process.stdout.write('\n');
  if (password !== confirmation) throw new Error('비밀번호가 일치하지 않습니다.');
  const hash = await passwordHash(password);
  password = '';
  confirmation = '';
  storeCredentials(username, hash);
  console.log('관리자 계정을 저장했습니다. 웹 화면을 새로고침한 후 로그인하세요.');
} catch (e) {
  muted = false;
  console.error('\n' + (e instanceof Error ? e.message : '계정 설정에 실패했습니다.'));
  process.exitCode = 1;
} finally {
  prompt.close();
}
