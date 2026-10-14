import test from 'node:test';
import assert from 'node:assert/strict';
import {installedProfile} from '../lib/package-selection.ts';
test('explicit package routes never fall back to a different installed package',()=>{
 const packages=[{id:'postgresql',installed:false},{id:'redis',installed:true},{id:'nginx',installed:true}];
 assert.equal(installedProfile(packages,'postgresql'),null);assert.equal(installedProfile(packages,'redis'),'redis');assert.equal(installedProfile(packages), 'nginx');
 assert.equal(installedProfile(packages,'unknown'),null);assert.equal(installedProfile(null,'nginx'),null);assert.equal(installedProfile([{id:'redis',installed:'true'}],'redis'),null);
});
