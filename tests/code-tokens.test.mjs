import test from 'node:test';
import assert from 'node:assert/strict';
import {codeTokens,codeLanguage} from '../lib/code-tokens.ts';
test('syntax display preserves code including quoted comment markers and HTML',()=>{
 for(const name of ['draft.conf','app.js','data.json','backup.sh','source.py','notes.txt']){
  const text='# comment\nconst x = "https://example/#anchor";\n<script>alert(1)</script>\n한글\t42\n';
  assert.equal(codeTokens(text,codeLanguage(name)).map(token=>token.text).join(''),text);
 }
 const tokens=codeTokens('const url = "https://example/#tag"; // comment\n','javascript');
 assert(tokens.some(token=>token.kind==='string'&&token.text.includes('#tag')));
 assert(tokens.some(token=>token.kind==='comment'&&token.text==='// comment'));
});
