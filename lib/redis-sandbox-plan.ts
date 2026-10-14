import type {RedisCandidate} from './redis-candidate.ts';
export type RedisSandboxPlan=Awaited<ReturnType<typeof redisSandboxPlan>>;
import {redisValidationPlan} from './redis-validation-plan.ts';
import {redisCandidateDataDirectories} from './redis-candidate-resources.ts';
const registered = new WeakSet<object>();
export function assertRedisSandboxPlan(plan:unknown):RedisSandboxPlan {
 if (!plan||typeof plan!=='object'||!registered.has(plan)) throw Error('Redis sandbox plan requires review');
 return plan as RedisSandboxPlan;
}

// A command plan is not evidence that namespaces are available or that a
// candidate has passed validation. Execution belongs to the trusted runner.
export async function redisSandboxPlan(candidate:RedisCandidate, runtime:string) {
 const validation = await redisValidationPlan(candidate, runtime);
 const args = [
  '--unshare-all', '--unshare-user', '--disable-userns', '--assert-userns-disabled',
  '--die-with-parent', '--new-session',
  '--cap-drop', 'ALL', '--clearenv',
  '--setenv', 'PATH', '/usr/bin:/bin', '--setenv', 'LANG', 'C',
  '--setenv', 'LC_ALL', 'C',
  ...['TMPDIR','TMP','TEMP'].flatMap(name=>['--setenv',name,'/mnt/data/build/tastedev-linux/redis-sandbox-scratch']),
  '--ro-bind', '/usr', '/usr',
  '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib',
  '--symlink', 'usr/lib64', '/lib64',
  '--proc', '/proc', '--dev', '/dev',
  '--size', '16777216', '--tmpfs', '/mnt/data/build/tastedev-linux/redis-sandbox-scratch',
  '--dir', '/run', '--dir', '/etc',
  ...redisCandidateDataDirectories(validation.resourceReview).flatMap(directory=>['--dir',directory]),
  '--ro-bind', candidate.directory, candidate.directory,
  '--bind', runtime, runtime, '--chdir', runtime,
  '--', '/usr/bin/prlimit',
  '--as=536870912:536870912', '--cpu=10:10',
  '--fsize=1048576:1048576', '--nofile=128:128',
  '--nproc=32:32', '--core=0:0',
  '--', validation.binary, ...validation.args,
 ];
 Object.freeze(validation.args); Object.freeze(validation);
 const plan = Object.freeze({
  binary: '/usr/bin/bwrap', args: Object.freeze(args),
  scope: 'redis-private-namespace-plan',
  executed: false, resourceIsolationVerified: false,
  operationalResourcesVerified: false, persistencePolicyValidated: false,
  resourceLimitsVerified: false,
  validation,
 });
 registered.add(plan); return plan;
}
