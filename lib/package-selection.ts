const order=['nginx','certbot','nodejs','postgresql','mariadb','redis'];
export function installedProfile(packages:readonly {id:string;installed?:boolean}[] | null | undefined,requested:string | null=null){
 const installed=new Set((packages||[]).filter(item=>item.installed===true).map(item=>item.id));
 if(requested!==null)return order.includes(requested)&&installed.has(requested)?requested:null;
 return order.find(id=>installed.has(id))||null;
}
