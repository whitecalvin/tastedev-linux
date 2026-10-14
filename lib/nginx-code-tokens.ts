export type NginxCodeToken = {text: string; kind: 'plain' | 'comment' | 'variable' | 'string' | 'punctuation'};
// Presentation only. Never use highlighting as native nginx validation.
export function nginxCodeTokens(source: string): NginxCodeToken[]{
 const tokens: NginxCodeToken[]=[];const pattern=/(#[^\n]*|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\$[A-Za-z_][A-Za-z_0-9]*|[{};])/g;
 let offset=0;for(const match of source.matchAll(pattern)){if(match.index>offset)tokens.push({text:source.slice(offset,match.index),kind:'plain'});const text=match[0];tokens.push({text,kind:text[0]==='#'?'comment':text[0]==='$'?'variable':text[0]==='"'||text[0]==="'"?'string':'punctuation'});offset=match.index+text.length;}
 if(offset<source.length)tokens.push({text:source.slice(offset),kind:'plain'});return tokens;
}
