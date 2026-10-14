import {configSchemas,isConfigKind,type ConfigValues} from './config-schema.ts';
export function configFieldDiff(kind: string,before: ConfigValues | null | undefined,after: ConfigValues | null | undefined){
 if(!isConfigKind(kind))throw new Error('Unsupported settings profile');
 const schema=configSchemas[kind];if(!schema)throw new Error('Unsupported settings profile');
 return schema.fields.map(([key,label,type])=>{
  const known=Object.hasOwn(before||{},key),left=before?.[key],right=after?.[key];
  const equal=type==='number'?left!==''&&right!==''&&Number.isFinite(Number(left))&&Number(left)===Number(right):left===right;
  return {key,label,type,known,before:known?left:null,after:right,changed:known&&!equal};
 });
}

export type ConfigFieldDifference = ReturnType<typeof configFieldDiff>[number];
