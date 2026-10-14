import path from 'node:path';
export const stateRoot = (): string => path.resolve(process.env.LINUX_STATE_ROOT || path.join(process.cwd(), '.runtime'));
