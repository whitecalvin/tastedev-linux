export const nginxServerPresets=[
 {id:'basic',label:'기본 서버 프리셋'},
 {id:'static',label:'정적 사이트 프리셋'},
 {id:'proxy',label:'리버스 프록시 프리셋'},
];

export function nginxServerPresetBody(id: string): string{
 if(id==='basic')return 'listen 80;\nserver_name example.com;\nroot /var/www/html;';
 if(id==='static')return 'listen 80;\nserver_name example.com;\nroot /var/www/html;\nindex index.html;\nlocation / {\n    try_files $uri $uri/ =404;\n}';
 if(id==='proxy')return 'listen 80;\nserver_name example.com;\nlocation / {\n    proxy_pass http://127.0.0.1:3000;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n}';
 throw Error('서버 프리셋을 확인하세요.');
}
