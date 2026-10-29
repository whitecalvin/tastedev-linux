import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import '@xterm/xterm/css/xterm.css';
import './globals.css';
import './console-design.css';
import {ToastProvider} from '../components/ui/toast-provider';
import {DraftProvider} from '../components/draft-provider';
import {languageCatalog,languageCoverageSummary} from '../lib/i18n.ts';
import {LanguageProvider} from '../components/language-provider';
import {cookies,headers} from 'next/headers';
import {initialLanguage,languageCookieName,languageDirection} from '../lib/language-preference.ts';
import {pageSession} from '../lib/page-session.ts';
import {nginxTreePreferences} from '../lib/nginx-tree-preferences.ts';
export const metadata = { title: 'LINUX · 서버 패키지 관리', description: '리눅스 서버 nginx, Certbot, Node.js 설치 관리' };
export const viewport: Viewport = {width:'device-width',initialScale:1,maximumScale:1,userScalable:false,viewportFit:'cover'};
export default async function Layout({ children }: { children: ReactNode }) {
 const [cookieStore,requestHeaders]=await Promise.all([cookies(),headers()]);
 const language=initialLanguage(cookieStore.get(languageCookieName)?.value,requestHeaders.get('accept-language') ?? undefined);
 const session=await pageSession();
 let initialTreeExpansion=null;
 try{initialTreeExpansion=session?nginxTreePreferences(session.userId):null;}
 catch{console.warn('[LINUX] Tree preference unavailable; using browser preference');}
 return <html lang={language.locale} dir={languageDirection(language.locale)} suppressHydrationWarning>
  <head><script src="/theme-init.js" async/></head>
  <body><noscript><style>{'html:not([data-theme]) body{visibility:visible}'}</style></noscript><LanguageProvider initialLocale={language.locale} initialCatalog={['ko','en'].includes(language.locale.split('-')[0])?{}:languageCatalog(language.locale)} coverage={languageCoverageSummary()} persisted={language.persisted}><DraftProvider initialTreeExpansion={initialTreeExpansion} preferenceUserId={session?.userId}><ToastProvider>{children}</ToastProvider></DraftProvider></LanguageProvider></body>
 </html>;
}
