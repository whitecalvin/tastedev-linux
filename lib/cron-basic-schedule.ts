export type BasicCronSchedule = {kind: 'daily' | 'weekly' | 'monthly'; hour: number; minute: number; day?: number};
const integer=(value: unknown,min: number,max: number)=>{const number=(typeof value==='number'||typeof value==='string'&&/^\d+$/.test(value))?Number(value):NaN;if(!Number.isInteger(number)||number<min||number>max)throw Error('예약 시간 범위를 확인하세요.');return number;};
export function basicCronSchedule({kind,hour,minute,day}: {kind: unknown; hour: unknown; minute: unknown; day?: unknown}){
 const time=`${integer(minute,0,59)} ${integer(hour,0,23)}`;
 if(kind==='daily')return `${time} * * *`;
 if(kind==='weekly')return `${time} * * ${integer(day,0,6)}`;
 if(kind==='monthly')return `${time} ${integer(day,1,31)} * *`;
 throw Error('예약 반복 유형을 선택하세요.');
}
export function parseBasicCronSchedule(schedule: unknown): BasicCronSchedule | null{
 if(typeof schedule!=='string')return null;const parts=schedule.trim().split(/\s+/);if(parts.length!==5||!/^\d+$/.test(parts[0])||!/^\d+$/.test(parts[1]))return null;
 let kind: BasicCronSchedule['kind'],day: number | undefined;if(parts.slice(2).join(' ')==='* * *')kind='daily';else if(parts[2]==='*'&&parts[3]==='*'&&/^\d+$/.test(parts[4])){kind='weekly';day=Number(parts[4])===7?0:Number(parts[4]);}else if(/^\d+$/.test(parts[2])&&parts[3]==='*'&&parts[4]==='*'){kind='monthly';day=Number(parts[2]);}else return null;
 const result={kind,hour:Number(parts[1]),minute:Number(parts[0]),...(day!==undefined?{day}:{})};try{basicCronSchedule(result);return result;}catch{return null;}
}
