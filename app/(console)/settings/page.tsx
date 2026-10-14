import type { SearchPageProps } from '../../route-types';
import {appRestartAvailability} from '../../../lib/app-restart.ts';
import {headers} from 'next/headers';
import {networkSettings} from '../../../lib/network-settings.ts';
import {systemSettings} from '../../../lib/system-settings.ts';
import {requirePageSession} from '../../../lib/page-session.ts';
import {aiSettings} from '../../../lib/ai-settings.ts';
import {securitySettings} from '../../../lib/security.ts';
import SystemSettings from '../../../components/system-settings';
export default async function Page({searchParams}: SearchPageProps){await requirePageSession('/settings',searchParams);return <SystemSettings initial={aiSettings()} general={systemSettings()} network={{...networkSettings(new URL('http://'+((await headers()).get('host')||'127.0.0.1:8791')).port),...await appRestartAvailability()}} readOnly={(await securitySettings()).settings.readOnly}/>;}
