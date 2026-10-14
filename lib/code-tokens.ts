export type CodeLanguage='javascript'|'json'|'shell'|'config'|'python'|'text';
export type CodeToken={text:string;kind:'plain'|'keyword'|'string'|'comment'|'variable'|'number'};
const languages:Readonly<Record<string,CodeLanguage>>={js:'javascript',jsx:'javascript',mjs:'javascript',ts:'javascript',tsx:'javascript',json:'json',sh:'shell',env:'config',conf:'config',cnf:'config',ini:'config',py:'python'};
export function codeLanguage(name:string):CodeLanguage{const ext=name.split('.').at(-1)?.toLowerCase();return ext?languages[ext]||'text':'text';}
export function codeTokens(text:string,language:CodeLanguage):CodeToken[]{
 if(language==='text')return [{text,kind:'plain'}];
 const pattern=/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|#[^\n]*|\b(?:const|let|var|function|return|async|await|import|export|from|if|else|for|while|class|new|throw|try|catch|true|false|null|def|self|None|True|False)\b|\$[a-zA-Z_][a-zA-Z0-9_]*|\b\d+(?:\.\d+)?(?:[kKmMgG][bB]?)?\b)/g;
 const result:CodeToken[]=[];let position=0;
 for(const match of text.matchAll(pattern)){
  if(match.index>position)result.push({text:text.slice(position,match.index),kind:'plain'});
  const value=match[0];let kind:CodeToken['kind']='keyword';
  if(value.startsWith('"')||value.startsWith("'"))kind='string';
  else if(value.startsWith('//'))kind=language==='javascript'?'comment':'plain';
  else if(value.startsWith('#'))kind=['config','shell','python'].includes(language)?'comment':'plain';
  else if(value.startsWith('$'))kind='variable';
  else if(/^\d/.test(value))kind='number';
  result.push({text:value,kind});position=match.index+value.length;
 }
 if(position<text.length)result.push({text:text.slice(position),kind:'plain'});
 return result;
}
