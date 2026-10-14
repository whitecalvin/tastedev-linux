#!/usr/bin/env python3
"""Local Linux package installation console. Python standard library only."""
import argparse
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parent
PACKAGES = {'nginx': ['nginx'], 'certbot': ['certbot', 'python3-certbot-nginx'], 'nodejs': ['nodejs', 'npm']}
BINARIES = {'nginx': 'nginx', 'certbot': 'certbot', 'nodejs': 'node'}

def command_for(names):
    if not isinstance(names, list) or not names or len(names) > 3 or any(not isinstance(n, str) or n not in PACKAGES for n in names) or len(set(names)) != len(names):
        raise ValueError('설치할 패키지를 올바르게 선택하세요.')
    return ['apt-get', 'install', '--yes', '--no-remove', '--no-upgrade', *[p for n in names for p in PACKAGES[n]]]

def supported():
    try:
        values = dict(line.split('=', 1) for line in Path('/etc/os-release').read_text().splitlines() if '=' in line)
        return bool({'debian', 'ubuntu'} & set((values.get('ID', '') + ' ' + values.get('ID_LIKE', '')).replace('"', '').split())) and bool(shutil.which('apt-get'))
    except OSError:
        return False

def inventory():
    result = []
    for name, packages in PACKAGES.items():
        states = []
        for package in packages:
            try:
                p = subprocess.run(['dpkg-query', '-W', '-f=${Status}\t${Version}', package], capture_output=True, text=True, timeout=5)
                states.append({'name': package, 'installed': p.returncode == 0 and p.stdout.startswith('install ok installed\t'), 'version': p.stdout.split('\t')[-1] if p.returncode == 0 else None})
            except (OSError, subprocess.TimeoutExpired):
                states.append({'name': package, 'installed': False, 'version': None})
        binary = shutil.which(BINARIES[name])
        digest = None
        if binary:
            try:
                with open(binary, 'rb') as f:
                    digest = hashlib.file_digest(f, 'sha256').hexdigest()
            except OSError:
                pass
        result.append({'id': name, 'installed': all(s['installed'] for s in states), 'packages': states, 'binary': binary, 'sha256': digest})
    return result

class App:
    def __init__(self, enabled=False, token=None):
        self.enabled = enabled
        self.token = token or secrets.token_urlsafe(32)
        self.lock = threading.Lock()
        self.job = None

    def snapshot(self):
        with self.lock:
            return json.loads(json.dumps(self.job))

    def start(self, names):
        command = command_for(names)
        if not self.enabled or os.geteuid() != 0 or not supported():
            raise PermissionError('설치 모드, 관리자 권한 및 Ubuntu/Debian 환경이 필요합니다.')
        with self.lock:
            if self.job and self.job['status'] == 'running':
                raise RuntimeError('이미 설치 작업이 진행 중입니다.')
            self.job = {'id': secrets.token_hex(8), 'status': 'running', 'command': command, 'logs': [], 'startedAt': time.time(), 'exitCode': None}
        threading.Thread(target=self.run, args=(command,), daemon=True).start()
        return self.snapshot()

    def run(self, command):
        # Fixed argv, no shell, no arbitrary package names or user-controlled options.
        try:
            env = dict(os.environ, DEBIAN_FRONTEND='noninteractive', NEEDRESTART_MODE='l')
            with subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env, start_new_session=True) as process:
                timer = threading.Timer(900, lambda: process.kill() if process.poll() is None else None)
                timer.start()
                try:
                    for line in process.stdout:
                        with self.lock:
                            self.job['logs'].append(line.rstrip()[:2000])
                            self.job['logs'] = self.job['logs'][-1000:]
                    code = process.wait()
                finally:
                    timer.cancel()
            with self.lock:
                self.job.update(status='success' if code == 0 else 'failed', exitCode=code, finishedAt=time.time())
        except Exception as error:
            with self.lock:
                self.job['logs'].append(str(error))
                self.job.update(status='failed', finishedAt=time.time())

class Handler(BaseHTTPRequestHandler):
    def send(self, status, data, kind='application/json; charset=utf-8'):
        body = json.dumps(data, ensure_ascii=False).encode() if kind.startswith('application/json') else data
        self.send_response(status)
        self.send_header('Content-Type', kind)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        self.end_headers()
        self.wfile.write(body)

    def authorized(self):
        return hmac.compare_digest(self.headers.get('Authorization', ''), 'Bearer ' + self.server.app.token)

    def do_GET(self):
        if self.path in ('/', '/app.js', '/style.css'):
            filename = {'/': 'index.html', '/app.js': 'app.js', '/style.css': 'style.css'}[self.path]
            kind = {'/': 'text/html', '/app.js': 'text/javascript', '/style.css': 'text/css'}[self.path]
            return self.send(200, (ROOT / 'static' / filename).read_bytes(), kind + '; charset=utf-8')
        if not self.authorized():
            return self.send(401, {'error': '관리자 토큰을 확인하세요.'})
        if self.path == '/api/status':
            return self.send(200, {'hostname': socket.gethostname(), 'supported': supported(), 'canInstall': self.server.app.enabled and os.geteuid() == 0 and supported(), 'packages': inventory(), 'job': self.server.app.snapshot()})
        if self.path == '/api/job':
            return self.send(200, {'job': self.server.app.snapshot()})
        self.send(404, {'error': '페이지를 찾을 수 없습니다.'})

    def do_POST(self):
        if not self.authorized():
            return self.send(401, {'error': '관리자 토큰을 확인하세요.'})
        origin = self.headers.get('Origin')
        if origin and origin != 'http://' + self.headers.get('Host', ''):
            return self.send(403, {'error': '다른 사이트의 요청은 허용하지 않습니다.'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > 4096:
                raise ValueError('요청 크기가 올바르지 않습니다.')
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError('요청 형식이 올바르지 않습니다.')
            command = command_for(data.get('packages'))
            if self.path == '/api/plan':
                return self.send(200, {'command': command, 'notice': '저장소의 패키지를 설치합니다. 의존성 설치와 패키지 기본 서비스 시작이 발생할 수 있습니다.'})
            if self.path == '/api/install':
                if data.get('confirm') is not True:
                    raise ValueError('설치 영향 확인이 필요합니다.')
                return self.send(202, {'job': self.server.app.start(data['packages'])})
            self.send(404, {'error': '페이지를 찾을 수 없습니다.'})
        except PermissionError as error:
            self.send(403, {'error': str(error)})
        except RuntimeError as error:
            self.send(409, {'error': str(error)})
        except (ValueError, TypeError) as error:
            self.send(400, {'error': str(error)})

    def log_message(self, *_):
        pass

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8787)
    parser.add_argument('--enable-install', action='store_true')
    args = parser.parse_args()
    token = os.environ.get('LINUX_ADMIN_TOKEN')
    if not token or len(token) < 24:
        parser.error('24자 이상 LINUX_ADMIN_TOKEN 환경 변수를 지정하세요.')
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    server.app = App(args.enable_install, token)
    print(f'LINUX http://127.0.0.1:{args.port} (install={args.enable_install})', flush=True)
    server.serve_forever()

if __name__ == '__main__':
    main()
