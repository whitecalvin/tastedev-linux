import {listFiles} from './workspace.ts';
import {nodeEnvFiles} from './node-env-files.ts';
export async function nodeWorkspaceTree(){return nodeEnvFiles(await listFiles());}
