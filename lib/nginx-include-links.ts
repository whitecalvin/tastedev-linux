export type NginxIncludeLinks<F> = {supported: true; pattern: string; files: F[]} | {supported: false; pattern?: never; files: F[]};
export const certbotNginxOptions='/etc/letsencrypt/options-ssl-nginx.conf';
// Navigation over already discovered files, not an activation or native glob check.
export function nginxIncludeLinks<F extends {path: string}>(node: {kind?: string; label?: unknown} | null | undefined,files: F[],root='/etc/nginx'): NginxIncludeLinks<F> | null{
 if(node?.kind!=='directive'||typeof node.label!=='string'||!/^include\s+/.test(node.label))return null;
 let pattern=node.label.replace(/^include\s+/, '').trim();if((pattern.startsWith('"')&&pattern.endsWith('"'))||(pattern.startsWith("'")&&pattern.endsWith("'")))pattern=pattern.slice(1,-1);
 if(typeof root==='string'&&root.startsWith('/')&&!pattern.startsWith('/'))pattern=root+'/'+pattern;
 if(typeof root!=='string'||!root.startsWith('/')||(!pattern.startsWith(root+'/')&&pattern!==certbotNginxOptions)||/[\\\s?\[\]$]/.test(pattern)||pattern.split('/').some(part=>part==='.'||part==='..')||pattern.slice(0,pattern.lastIndexOf('/')).includes('*'))return {supported:false,files:[]};
 const expression=new RegExp('^'+pattern.split('*').map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('[^/]*')+'$');
 return {supported:true,pattern,files:files.filter(file=>typeof file.path==='string'&&expression.test(file.path))};
}
