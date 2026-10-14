import assert from 'node:assert/strict';
export type JsonRecord=Record<string,unknown>;
export function jsonRecord(value:unknown):JsonRecord{assert(value!==null&&typeof value==='object'&&!Array.isArray(value),'Expected a JSON object');return Object.fromEntries(Object.entries(value));}
export function recordField(value:JsonRecord,key:string):JsonRecord{return jsonRecord(value[key]);}
export function listField(value:JsonRecord,key:string):JsonRecord[]{const rows=value[key];assert(Array.isArray(rows),'Expected JSON array: '+key);return rows.map(jsonRecord);}
export function textField(value:JsonRecord,key:string):string{const text=value[key];assert(typeof text==='string','Expected JSON string: '+key);return text;}
export async function successfulJson(response:Response):Promise<JsonRecord>{assert.equal(response.status,200,await response.clone().text());const value:unknown=await response.json();return jsonRecord(value);}
