import {StringDecoder} from 'node:string_decoder';
import {processLogLines} from './process-log-lines.ts';

// Decode the helper envelope before bounding individual shell log rows.
export function installProcessOutput(onLines: (lines: string[])=>void, maxEnvelope = 26 * 1024 * 1024) {
  if (!Number.isInteger(maxEnvelope) || maxEnvelope < 16 || maxEnvelope > 26 * 1024 * 1024) throw Error('Invalid installation output limit');
  function stream() {
    const decoder = new StringDecoder('utf8');
    const rows = processLogLines(onLines);
    let pending = '', bytes = 0, dropping = false, ended = false;
    function consume(text: string, flush = false) {
      const parts = text.split('\n');
      for (let i = 0; i < parts.length; i++) {
        if (!dropping) {
          bytes += Buffer.byteLength(parts[i]);
          if (bytes > maxEnvelope) {
            pending = ''; dropping = true;
            rows.stdout(Buffer.from('설치 작업 출력이 처리 한도를 넘어 일부 내용을 생략했습니다.\n'));
          } else pending += parts[i];
        }
        if (i < parts.length - 1 || flush) {
          if (!dropping && pending) {
            let parsed: unknown; try { parsed = JSON.parse(pending); } catch {}
            let shown = pending;
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {const value=parsed as Record<string,unknown>;
              if (Object.keys(value).join(',') === 'logs' && typeof value.logs === 'string') shown = value.logs;
              else if (Object.keys(value).sort().join(',') === 'action,message,protocol,status' && value.protocol === 'tastedev-helper-error-v1' && value.action === 'install' && typeof value.status==='number'&&[400,403,404,409,422,500,503].includes(value.status) && typeof value.message === 'string' && value.message.length <= 2000 && !/[\0\r\n]/.test(value.message)) shown = value.message;
            }
            rows.stdout(Buffer.from(shown.endsWith('\n') ? shown : shown + '\n'));
          }
          pending = ''; bytes = 0; dropping = false;
        }
      }
    }
    return {write(chunk: Buffer) { if (!ended) consume(decoder.write(chunk)); }, end() { if (ended) return; ended = true; consume(decoder.end(), true); rows.end(); }};
  }
  const stdout = stream(), stderr = stream();
  return {stdout: stdout.write, stderr: stderr.write, end() { stdout.end(); stderr.end(); }};
}
