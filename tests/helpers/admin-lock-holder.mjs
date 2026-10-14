import {adminLockFixture} from './admin-lock-fixture.mjs';
const fixture=await adminLockFixture(process.argv[2]);fixture.acquire();process.stdout.write('ready\n');process.stdin.resume();
