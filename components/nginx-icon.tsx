type NginxIconName = 'start' | 'stop' | 'check' | 'backup' | 'restore' | 'save' | 'add' | 'delete';
export default function NginxIcon({name}: {name: NginxIconName}){
 const paths={start:'M8 5l11 7-11 7Z',stop:'M6 6h12v12H6Z',check:'m5 12 4 4L19 6 M4 3h16v18H4Z',backup:'M4 4h16v5H4Z M6 9v11h12V9 M10 13h4',restore:'M4 9a8 8 0 1 1-1 7 M4 3v6h6 M12 8v5l3 2',save:'m5 12 4 4 10-10',add:'M12 5v14M5 12h14',delete:'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13'};
 return <svg viewBox="0 0 24 24" aria-hidden="true" className="nginx-action-icon"><path d={paths[name]||paths.check}/></svg>;
}
