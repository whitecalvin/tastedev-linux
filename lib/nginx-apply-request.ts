const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {nginxEditableFile} from './nginx-file-update.ts';
import {nginxValidationLocale} from './nginx-locale.ts';
import {parseNginxTree} from './nginx-syntax.ts';
const fail: ()=>never=()=>{throw Object.assign(Error('nginx 설정과 실행 환경 검토를 확인하세요.'),{status:400});};
export function prepareNginxApply(input: unknown){
 if(!object(input)||Object.keys(input).some(key=>!['path','text','version','graphVersion','confirm','review'].includes(key))||input.confirm!==true||typeof input.text!=='string'||Buffer.byteLength(input.text)>262144||input.text.includes('\0')||typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version)||typeof input.graphVersion!=='string'||!/^[a-f0-9]{64}$/.test(input.graphVersion))fail();
 nginxEditableFile(input.path);parseNginxTree(input.text);
 const review=input.review;
 if(!object(review)||Object.keys(review).some(key=>!['confirm','pid','start','graphVersion','locale'].includes(key))||review.confirm!==true||typeof review.pid!=='number'||!Number.isInteger(review.pid)||review.pid<=0||typeof review.start!=='string'||!/^\d+$/.test(review.start)||review.graphVersion!==input.graphVersion)fail();
 return {path:input.path,text:input.text,version:input.version,graphVersion:input.graphVersion,confirm:true,review:{confirm:true,pid:review.pid,start:review.start,graphVersion:review.graphVersion,locale:nginxValidationLocale(review.locale)}};
}
export function prepareNginxRestore(input: unknown){
 if(!object(input)||Object.keys(input).some(key=>!['backupId','path','version','graphVersion','confirm','review'].includes(key))||typeof input.backupId!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(input.backupId))fail();
 const {backupId,...configuration}=input;
 const {text,...prepared}=prepareNginxApply({...configuration,text:''});
 return {backupId,...prepared};
}
