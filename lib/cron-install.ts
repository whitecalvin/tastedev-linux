import { spawn } from 'node:child_process';

// Some installed cron versions truncate input filenames. Stdin also avoids
// leaving a temporary copy of the user's commands on disk.
export function installCron(text: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('/usr/bin/crontab', ['-'], {
      env: { ...process.env, LC_ALL: 'C' },
      stdio: ['pipe', 'ignore', 'pipe'],
    });
    let stderr = '', inputError: Error | undefined, timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 5000);
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-8192); });
    child.stdin.on('error', error => { inputError = error; });
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('close', (code, signal) => {
      clearTimeout(timer);
      if (!timedOut && code === 0 && !inputError) resolve();
      else reject(Object.assign(new Error(timedOut ? 'cron 저장 시간이 초과되었습니다.' : stderr.trim() || 'cron 저장에 실패했습니다.'), { code, signal }));
    });
    child.stdin.end(text, 'utf8');
  });
}
