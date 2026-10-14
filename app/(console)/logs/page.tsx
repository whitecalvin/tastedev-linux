import type { SearchPageProps } from '../../route-types';
import {consoleInitialData} from '../../../lib/console-initial-data.ts';
import ConsoleWorkspace from '../../../components/console-workspace';
import {requirePageSession} from '../../../lib/page-session.ts';
export default async function Page({searchParams}: SearchPageProps){await requirePageSession('/logs',searchParams);return <ConsoleWorkspace embedded view='logs' initialData={await consoleInitialData({operations:true})}/>;}
