import type {NginxPreset} from './nginx-presets.ts';
import type {NginxSettingInfo} from './nginx-setting-info.ts';
// Editable examples for open-source nginx 1.28; not detected server defaults.
const rows: [string,string][]=[['server','127.0.0.1:3000'],['zone','backend_zone 64k'],['hash','$request_uri consistent'],['ip_hash',''],['keepalive','32'],['keepalive_requests','1000'],['keepalive_time','1h'],['keepalive_timeout','60s'],['least_conn',''],['random','two least_conn'],['resolver','127.0.0.1 valid=30s'],['resolver_timeout','30s']];
export function nginxUpstreamPresets(context: string): NginxPreset[]{return context==='upstream'?rows.map<NginxPreset>(([name,value])=>({name,value,kind:'directive'})):[];}
export const nginxUpstreamNames=Object.freeze(rows.map(([name])=>name));
