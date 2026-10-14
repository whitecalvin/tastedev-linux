import {domainName} from './nginx-config.ts';
export function manualBackupRequest(input: {kind?: unknown;domain?: unknown}|null|undefined){
 if(input?.kind==='cron')return {kind:'cron'};
 if(input?.kind==='nginx')return {kind:'nginx',domain:domainName(input.domain)};
 throw Object.assign(new Error('백업 대상을 확인하세요.'),{status:400});
}
