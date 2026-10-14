import type {ChildProcessByStdio} from 'node:child_process';
import type {Readable} from 'node:stream';
export type FixtureNginx=ChildProcessByStdio<null,Readable,Readable>;
export type NginxHttpReport={workDirectory:string;status:'PASS'|'FAIL';scope:string;binary:string;operatingServicesChanged:false;checks:({name:string;status:'PASS'}&Record<string,unknown>)[];version?:string;binarySHA256?:string;error?:string;temporaryNginxStopped?:boolean;temporaryUpstreamsStopped?:boolean;fixtureRemoved?:boolean};
