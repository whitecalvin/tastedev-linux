'use client';
import {useEffect} from 'react';
import {maintainBrowserSession} from '../lib/browser-session-maintenance.ts';
export function useSessionMaintenance(onExpired: () => void){
 useEffect(()=>maintainBrowserSession({target:window,document,fetchStatus:(options: {signal: AbortSignal})=>fetch('/api/auth/status',{cache:'no-store',credentials:'same-origin',...options}),onExpired}),[onExpired]);
}
