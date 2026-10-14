import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import {networkConfiguration,networkOrigins} from '../lib/network-settings.ts';
import nextEnv from '@next/env';
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
nextEnv.loadEnvConfig(project);
try {
  await access(path.join(project, '.next/BUILD_ID'));
} catch {
  console.error('먼저 npm run build를 실행하세요.');
  process.exit(1);
}
const network=networkConfiguration();
const host=network.host;
const port = String(network.port);
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  console.error('PORT는 1~65535 범위여야 합니다.');
  process.exit(1);
}
const stateRoot = path.resolve(process.env.LINUX_STATE_ROOT || path.join(project, '.runtime'));
const server = spawn(
  process.execPath,
  [
    path.join(project, 'node_modules/next/dist/bin/next'),
    'start',
    '--hostname',
    host,
    '--port',
    port,
  ],
  {
    cwd: project,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: port,
      LINUX_ACTIVE_HOST: host,
      LINUX_RUNTIME_NETWORK_ORIGINS: JSON.stringify(networkOrigins(host,network.port)),
      HOSTNAME: host,
      LINUX_STATE_ROOT: stateRoot,
      LINUX_AUTH_ROOT: path.resolve(process.env.LINUX_AUTH_ROOT || stateRoot),
    },
  },
);
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.kill(signal));
server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.on('exit', (code) => {
  process.exitCode = code ?? 0;
});
