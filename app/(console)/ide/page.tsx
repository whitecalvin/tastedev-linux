import type { SearchPageProps } from '../../route-types';
import {initialStatus} from '../../../lib/console-initial-data.ts';
import {installedProfile} from '../../../lib/package-selection.ts';
import ConsoleWorkspace from '../../../components/console-workspace';
import {requirePageSession} from '../../../lib/page-session.ts';
import {redirect} from 'next/navigation';
export default async function Page({searchParams}: SearchPageProps){const {package:kind}=await searchParams;if(typeof kind==='string'&&['nginx','certbot','nodejs','postgresql','mariadb','redis'].includes(kind))redirect('/ide/packages/'+kind);await requirePageSession('/ide',searchParams);const selected=installedProfile((await initialStatus()).packages);if(selected)redirect('/ide/packages/'+selected);return <ConsoleWorkspace embedded view='ide'/>;}
