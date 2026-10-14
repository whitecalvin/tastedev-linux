import test from 'node:test';
import assert from 'node:assert/strict';
import { nginxConfig } from '../lib/nginx-config.ts';
import { databaseConfigProfile } from '../lib/database-config-profile.ts';
import { cronEntry, cronJobs, updateCron, removeCron } from '../lib/server-tools.ts';
test('new configuration previews use LINUX branding', () => {
  assert(
    nginxConfig({ domain: 'fixture.example', port: 80, mode: 'proxy', upstreamPort: 3000 }).startsWith(
      '# Managed by LINUX\n',
    ),
  );
  for (const kind of ['postgresql', 'redis']) assert(databaseConfigProfile(kind, {}).startsWith('# LINUX '));
  assert(
    cronEntry({ name: 'fixture', schedule: '0 3 * * *', command: '/bin/true', enabled: true }).startsWith(
      '# LINUX: fixture\n',
    ),
  );
});
test('legacy cron markers remain editable and removable without duplicate jobs', () => {
  const job = { name: 'fixture', schedule: '0 3 * * *', command: '/bin/true', enabled: true },
    legacy = cronEntry(job).replace('LINUX', 'LINEX'),
    prefix = 'PATH=/usr/bin\n';
  assert.deepEqual(cronJobs(prefix + legacy), [job]);
  const updated = updateCron(prefix + legacy, { ...job, enabled: false });
  assert(updated.startsWith(prefix));
  assert(updated.includes('# LINUX: fixture'));
  assert(!updated.includes('LINEX'));
  assert.deepEqual(cronJobs(updated), [{ ...job, enabled: false }]);
  assert.equal(removeCron(prefix + legacy, job.name), prefix);
  assert.equal(removeCron(prefix + updated.slice(prefix.length), job.name), prefix);
  const duplicate = legacy + cronEntry(job);
  assert.deepEqual(cronJobs(duplicate), []);
  assert.throws(() => updateCron(duplicate, job));
  assert.throws(() => removeCron(duplicate, job.name));
});
