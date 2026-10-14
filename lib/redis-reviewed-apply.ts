import type {RedisApplyOptions} from './redis-apply.ts';
import {prepareRedisApply} from './redis-apply-request.ts';
import {assertRedisGraphVersion} from './redis-topology.ts';
import {applyRedisConfig} from './redis-apply.ts';
export async function applyReviewedRedis(input:unknown,{base='/etc/redis',...hooks}:RedisApplyOptions={}){
 const prepared=prepareRedisApply(input),graph=await assertRedisGraphVersion(prepared.graphVersion,base),main=graph.files.find(file=>file.path===prepared.path);
 if(main?.version!==prepared.version)throw Object.assign(Error('Redis main configuration changed; inspect it again'),{status:409});
 return applyRedisConfig({version:prepared.graphVersion,changes:prepared.changes,confirm:true},{base,...hooks});
}
