import test from 'node:test';
import assert from 'node:assert/strict';
import {installProcessOutput} from '../lib/install-process-output.ts';

test('large escaped apt output survives fragmented UTF-8 envelopes as shell rows', () => {
  const expected = Array.from({length: 220}, (_, i) => `설치 😀 ${i} "파일" \\경로`);
  const rows = [], output = installProcessOutput(lines => rows.push(...lines));
  const raw = Buffer.from(JSON.stringify({logs: expected.join('\n') + '\n'}) + '\n');
  for (let i = 0; i < raw.length; i += 7) output.stdout(raw.subarray(i, i + 7));
  output.end(); output.end();
  assert.deepEqual(rows, expected);
});
test('independent stderr, install failures and literal shell JSON remain readable', () => {
  const rows = [], output = installProcessOutput(lines => rows.push(...lines));
  output.stdout(Buffer.from('{"logs":"한'));
  output.stderr(Buffer.from(JSON.stringify({protocol:'tastedev-helper-error-v1',action:'install',status:422,message:'설치 실패'}) + '\n'));
  output.stdout(Buffer.from('글\\n{\\"logs\\":\\"literal\\"}\\n"}\n'));
  output.stderr(Buffer.from('마지막 오류')); output.end();
  assert.deepEqual(rows, ['설치 실패', '한글', '{"logs":"literal"}', '마지막 오류']);
});
test('oversized envelopes are bounded and subsequent output remains available', () => {
  const rows = [], output = installProcessOutput(lines => rows.push(...lines), 64);
  output.stdout(Buffer.from('x'.repeat(10000) + '\n' + JSON.stringify({logs:'다음 결과\n'}) + '\n'));
  output.end();
  assert.equal(rows.length, 2); assert.match(rows[0], /처리 한도/); assert.equal(rows[1], '다음 결과');
});
