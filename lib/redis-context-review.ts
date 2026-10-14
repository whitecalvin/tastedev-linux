type RedisReview={confirm:true;pid:number;uid:number;start:string;main:'/etc/redis/redis.conf';graphVersion:string};
type InspectorOptions={inspect?:()=>unknown|Promise<unknown>;readGraph?:()=>unknown|Promise<unknown>;candidateVersion?:unknown};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fail:(status?:number)=>never=(status=400)=>{throw Object.assign(Error('Review current Redis process and main configuration'),{status});};
// Administrator attestation is explicitly distinct from observed startup argv.
function prepareReview(input:unknown):RedisReview{
 if(!object(input)||input.confirm!==true||Object.keys(input).some(key=>!['confirm','pid','uid','start','main','graphVersion'].includes(key))||input.main!=='/etc/redis/redis.conf'||typeof input.pid!=='number'||!Number.isInteger(input.pid)||input.pid<=0||typeof input.uid!=='number'||!Number.isInteger(input.uid)||input.uid<0||typeof input.start!=='string'||!/^\d+$/.test(input.start)||typeof input.graphVersion!=='string'||!/^[a-f0-9]{64}$/.test(input.graphVersion))fail();
 return {confirm:true,pid:input.pid,uid:input.uid,start:input.start,main:input.main,graphVersion:input.graphVersion};
}
export function redisContextReview(value:unknown,scope:unknown,graphVersion:unknown){
 const input=prepareReview(value);
 if(!object(scope)||scope.identityVerified!==true||scope.service!=='redis-server.service'||scope.pid!==input.pid||scope.uid!==input.uid||scope.start!==input.start||graphVersion!==input.graphVersion||scope.startupMainVerified&&scope.main!==input.main)fail(409);
 return Object.freeze({...scope,pid:input.pid,uid:input.uid,start:input.start,main:input.main,identityVerified:true as const,service:'redis-server.service' as const,mainReview:'administrator-attested' as const,observedStartupMainVerified:scope.startupMainVerified===true});
}
export function reviewedRedisInspector(review:unknown,{inspect,readGraph,candidateVersion}:InspectorOptions={}){
 if(typeof inspect!=='function'||typeof readGraph!=='function'||candidateVersion!==undefined&&(typeof candidateVersion!=='string'||!/^[a-f0-9]{64}$/.test(candidateVersion)))fail();
 const captured=prepareReview(structuredClone(review));
 return async()=>{const before=await readGraph(),scope=await inspect(),after=await readGraph();if(!object(before)||!object(after)||!before.complete||!after.complete||typeof after.version!=='string'||before.version!==after.version||![captured.graphVersion,candidateVersion].includes(after.version))fail(409);return {...redisContextReview(captured,scope,captured.graphVersion),observedGraphVersion:after.version};};
}
