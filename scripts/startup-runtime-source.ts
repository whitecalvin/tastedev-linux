import {readRuntimeModule} from './runtime-source.ts';
export const startupRuntimeFiles: readonly string[]=Object.freeze(['scripts/prepare-next-cli.mjs','scripts/start-server.mjs','lib/network-settings.mjs','lib/runtime-paths.mjs','lib/error-code.mjs','scripts/setup-admin.mjs','lib/auth.mjs','lib/better-auth.mjs','lib/auth-password.mjs','lib/auth-store.mjs','lib/service-account.mjs','scripts/configure-service-account.mjs']);
export function readStartupRuntimeModule(name: string,project=process.cwd()){return readRuntimeModule(name,startupRuntimeFiles,project);}
