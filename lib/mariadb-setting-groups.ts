// Metadata only: values and comments never leave this parser.
export function mariadbSettingGroups(text: unknown): string[]{
 if(typeof text!=='string'||new TextEncoder().encode(text).length>262144||text.includes('\0')||/\r(?!\n)/.test(text))throw Error('Invalid configuration');
 const groups: string[]=[],seen=new Set<string>();
 for(const line of text.split(/\r?\n/)){const header=/^[ \t]*\[([^\]\r\n]+)\]/.exec(line);if(!header)continue;const name=header[1].trim();if(name&&!seen.has(name)){seen.add(name);groups.push(name);}}
 return groups;
}
