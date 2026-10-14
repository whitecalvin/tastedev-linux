type VersionGroup={id?:string;packages?:{name:string;installed:boolean;version?:string | null}[]};
export function installedPackageVersion(group:VersionGroup | null | undefined){
 const installed=(group?.packages||[]).filter(item=>item.installed&&typeof item.version==='string'&&item.version);
 const primary=({mariadb:'mariadb-server',redis:'redis-server'} as Record<string,string>)[group?.id??'']||group?.id;
 return installed.find(item=>item.name===primary)?.version||installed[0]?.version||null;
}
export function installedPackageVersionDetails(group:VersionGroup | null | undefined){
 return (group?.packages||[]).filter(item=>item.installed&&item.version).map(item=>item.name+' '+item.version).join('\n');
}
