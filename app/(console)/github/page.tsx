import type {SearchPageProps} from '../../route-types';
import {requirePageSession} from '../../../lib/page-session.ts';
import {securitySettings} from '../../../lib/security.ts';
import {githubSnapshot} from '../../../lib/github.ts';
import GitHubRepositories from '../../../components/github-repositories';
export default async function Page({searchParams}:SearchPageProps){
 await requirePageSession('/github',searchParams);
 return <GitHubRepositories initial={githubSnapshot()} readOnly={(await securitySettings()).settings.readOnly}/>;
}
