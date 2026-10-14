type PackageFilterStatus={packages:{id:string;installed?:boolean;packages?:{name:string}[]}[]};
export function filterPackages<T extends {id:string;name:string}>(catalog:readonly T[],status:PackageFilterStatus | null | undefined,query:string,filter:string,selected:readonly string[]=[]){
 const term=query.trim().toLowerCase();
 return catalog.filter(item=>{
  const pkg=status?.packages?.find(pkg=>pkg.id===item.id);
  const matches=[item.id,item.name,...(pkg?.packages||[]).map(pkg=>pkg.name)].some(value=>value.toLowerCase().includes(term));
  return matches&&(filter==='all'||filter==='selected'&&selected.includes(item.id)||filter==='installed'&&pkg?.installed===true||filter==='missing'&&pkg?.installed===false);
 });
}
