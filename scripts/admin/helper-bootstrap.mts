declare const require:NodeRequire;
export const fs:typeof import('node:fs')=require('node:fs');
export const path:typeof import('node:path')=require('node:path');
export const childProcess:typeof import('node:child_process')=require('node:child_process');
export const rawExecFileSync=childProcess.execFileSync;
export let adminNativeContext:Readonly<{fd:number;helper:string}>|null=null;
export const {randomUUID,createHash}:typeof import('node:crypto')=require('node:crypto');
export const BASE='/var/lib/linux/admin';
export const MARK='# Managed by LINUX\n';
export const units:readonly string[]=['nginx.service','cron.service','certbot.timer','postgresql.service','mariadb.service','redis-server.service'];
export function fail(message:string,status=400):never{throw Object.assign(new Error(message),{status});}
