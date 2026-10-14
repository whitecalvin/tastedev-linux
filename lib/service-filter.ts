export function filterServices<T extends {unit?:string;ActiveState?:string}>(services:readonly T[],query='',state='all'){
 const term=query.trim().toLowerCase();
 return services.filter(service=>String(service.unit||'').toLowerCase().includes(term)&&(state==='all'||['active','inactive','failed'].includes(state)&&service.ActiveState===state));
}
