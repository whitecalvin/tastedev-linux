import {statfsSync} from 'node:fs';

// exFAT change events are unreliable on this workspace; poll only in development.
let exfatWorkspace=false;
try{exfatWorkspace=statfsSync(new URL('.',import.meta.url)).type===0x2011bab0;}catch{}

export default {
  poweredByHeader: false,
  watchOptions: process.env.NODE_ENV==='development'&&exfatWorkspace ? {pollIntervalMs:1000} : undefined,
  async headers() {
    const development = process.env.NODE_ENV === 'development';
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Content-Security-Policy', value: `default-src 'self'; script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; connect-src 'self'${development ? ' ws://127.0.0.1:* ws://localhost:*' : ''}; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` },
    ] }];
  },
};
