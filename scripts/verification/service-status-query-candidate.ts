import type {ExecFileOptionsWithStringEncoding} from 'node:child_process';
export type ServiceQueryRow=Record<string,unknown>&{unit:string;ActiveState:string};
export type ServiceQueryRun=(binary:string,args:string[],options:ExecFileOptionsWithStringEncoding)=>Promise<{stdout:string}>;
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function complete(values:Record<string,string>):values is Record<string,string>&{Id:string;ActiveState:string;SubState:string;LoadState:string}{return typeof values.Id==='string'&&!!values.ActiveState&&!!values.SubState&&!!values.LoadState;}
// Read-only batch query. Identify rows by Id, never by output order.
export async function queryServiceStatuses(units:readonly string[],run:ServiceQueryRun):Promise<ServiceQueryRow[]> {
  if (!units.length) return [];
  let stdout = '',failure:unknown=null;
  try {
    ({stdout} = await run('/usr/bin/systemctl', ['show', ...units,
      '--property=Id,ActiveState,SubState,LoadState,UnitFileState,Description', '--no-pager'],
    {timeout: 5000, maxBuffer: 1024 * 1024, encoding: 'utf8'}));
  } catch (error) {
    failure = object(error)?error.stderr||error.message||'서비스 상태를 확인할 수 없습니다.':'서비스 상태를 확인할 수 없습니다.';
    // A missing unit may leave valid rows. Timeout/truncated output is not a snapshot.
    if (object(error)&&!error.killed && !error.signal && Number.isInteger(error.code) && typeof error.stdout === 'string') stdout = error.stdout;
  }
  const observed = new Map<string,ServiceQueryRow>();
  for (const block of stdout.trim().split(/\n\s*\n/)) {
    const values = Object.fromEntries(block.split('\n').filter(line => line.includes('=')).map(line => {
      const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1)];
    }));
    if (units.includes(values.Id) && complete(values)) {
      const {Id, ...state} = values; observed.set(Id, {unit:Id,...state});
    }
  }
  return units.map(unit => observed.get(unit) || {unit, ActiveState: 'unknown',
    error: failure || '서비스 상태를 확인할 수 없습니다.'});
}
