import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { configSchemas, configLabels } from '../lib/config-schema.ts';
test('all literal AI assistant copy including consent and cost notice has eight translations', async () => {
  const source = await readFile(new URL('../components/ai-log-assistant.tsx', import.meta.url), 'utf8');
  const keys = [...new Set([...source.matchAll(/t\(["']([^"']+)["']\)/g)].map((match) => match[1]))];
  assert(keys.length >= 16, 'Existing AI assistant copy must remain covered as new guidance is added');
  for (const required of [
    '위 로그를 검토했으며 설정한 AI 업체로 전송하는 데 동의합니다.',
    'AI 연결 또는 요청 제한 안내',
    'ChatGPT 구독과 API 사용 요금은 별도입니다. 이 앱에서 결제 설정은 변경하지 않습니다.',
  ]) assert(keys.includes(required), 'Consent and request-limit guidance must remain in the scanned copy: ' + required);
  for (const locale of ['en', 'ja', 'zh', 'de', 'fr', 'es', 'ru', 'ar']) {
    const catalog = JSON.parse(await readFile(new URL('../lib/locales/' + locale + '.json', import.meta.url), 'utf8'));
    for (const key of keys)
      assert.ok(typeof catalog[key] === 'string' && catalog[key].trim() && catalog[key] !== key, locale + ': ' + key);
  }
});
test('AI connection and masked log import copy is translated in eight catalogs', async () => {
  const keys = [
    'AI 오류 해결 도우미',
    '오류의 원인과 확인 명령, 해결 순서를 제안합니다.',
    '분석 사용 가능',
    '서버 설정 필요',
    '연결 확인 전',
    'AI 연결 상태 확인',
    '민감 정보 마스킹 후 로그를 불러왔습니다. 내용을 검토하세요.',
    '현재 오류 로그 불러오기',
  ];
  for (const locale of ['en', 'ja', 'zh', 'de', 'fr', 'es', 'ru', 'ar']) {
    const catalog = JSON.parse(await readFile(new URL('../lib/locales/' + locale + '.json', import.meta.url), 'utf8'));
    for (const key of keys)
      assert.ok(typeof catalog[key] === 'string' && catalog[key].trim() && catalog[key] !== key, locale + ': ' + key);
  }
});
test('account password controls and session revocation notice are translated in eight catalogs', async () => {
  const source = await readFile(new URL('../components/account-panel.tsx', import.meta.url), 'utf8');
  const keys = [...new Set([...source.matchAll(/t\("([^"]+)"\)/g)].map((match) => match[1]))];
  assert.equal(keys.length, 8);
  for (const locale of ['en', 'ja', 'zh', 'de', 'fr', 'es', 'ru', 'ar']) {
    const catalog = JSON.parse(await readFile(new URL('../lib/locales/' + locale + '.json', import.meta.url), 'utf8'));
    for (const key of keys)
      assert.ok(typeof catalog[key] === 'string' && catalog[key].trim() && catalog[key] !== key, locale + ': ' + key);
  }
});
test('package configuration schema has explicit translations in all six shipped catalogs', async () => {
  const keys = [
    ...new Set([
      ...Object.values(configSchemas).flatMap((schema) => [
        schema.description,
        schema.path,
        ...schema.fields.map((field) => field[1]),
      ]),
      ...Object.values(configLabels),
    ]),
  ].filter((key) => /[가-힣]/.test(key));
  for (const language of ['en', 'ja', 'zh', 'es', 'fr', 'de']) {
    const catalog = JSON.parse(
      await readFile(new URL('../lib/locales/' + language + '.json', import.meta.url), 'utf8'),
    );
    for (const key of keys)
      assert(typeof catalog[key] === 'string' && catalog[key].trim() && catalog[key] !== key, language + ': ' + key);
  }
});

test('Node environment import controls and validation errors are translated in the six main catalogs', async () => {
  const sources = await Promise.all(
    ['../components/node-env-import.tsx', '../lib/node-env.ts'].map((name) =>
      readFile(new URL(name, import.meta.url), 'utf8'),
    ),
  );
  const keys = [
    ...new Set(sources.flatMap((source) => [...source.matchAll(/(?:t|Error)\('([^']+)'\)/g)].map((match) => match[1]))),
  ].filter((key) => /[가-힣]/.test(key));
  assert(keys.length >= 15);
  for (const language of ['en', 'ja', 'zh', 'es', 'fr', 'de']) {
    const catalog = JSON.parse(
      await readFile(new URL('../lib/locales/' + language + '.json', import.meta.url), 'utf8'),
    );
    for (const key of keys)
      assert(typeof catalog[key] === 'string' && catalog[key].trim() && catalog[key] !== key, language + ': ' + key);
  }
});

test('nginx apply review controls and locale explanation are translated in all eight catalogs', async () => {
  const keys = [
    '설정·서비스 검토',
    '실행 환경의 locale을 확인하세요. 조회 값은 실제 시작 환경을 보증하지 않습니다. 빈 값은 C 기본값입니다.',
    '설정 변경, locale 및 nginx reload 영향을 검토했습니다.',
    '검사 후 적용',
    '설정 적용 완료. 트리를 다시 조회하세요.',
    '현재 설정과 서비스를 다시 조회하세요.',
  ];
  for (const locale of ['en', 'ja', 'zh', 'de', 'fr', 'es', 'ru', 'ar']) {
    const catalog = JSON.parse(await readFile(new URL('../lib/locales/' + locale + '.json', import.meta.url), 'utf8'));
    for (const key of keys) assert.ok(typeof catalog[key] === 'string' && catalog[key] !== key, locale + ': ' + key);
  }
});

test('Redis resource review scope and category copy is translated in all eight catalogs', async () => {
  const keys = [
    'Redis 리소스 검토',
    '별도 검증 필요',
    '표시하지 않은 항목',
    '추가 문법 검토 필요',
    '모듈',
    '복제 연결',
    '외부 파일',
    '클러스터',
    '네트워크',
    '지속성',
    '데이터 폴더',
    '출력 파일',
    '소켓',
    '선택한 파일의 검토 목록입니다. 전체 include와 실행 환경은 별도로 검사해야 합니다.',
    '후보 파일의 검토 목록입니다. 실행 안전성 검증 결과는 아닙니다.',
    '검토 목록에 식별된 항목이 없습니다. 실행 안전성을 보증하지 않습니다.',
  ];
  for (const locale of ['en', 'ja', 'zh', 'de', 'fr', 'es', 'ru', 'ar']) {
    const catalog = JSON.parse(await readFile(new URL('../lib/locales/' + locale + '.json', import.meta.url), 'utf8'));
    for (const key of keys) assert.ok(typeof catalog[key] === 'string' && catalog[key] !== key, locale + ': ' + key);
  }
});

test('terminal controls and server validation errors have explicit translations in eight catalogs', async () => {
  const sourceFiles = [
    '../components/tabbed-terminal.tsx',
    '../components/terminal-screen.tsx',
    '../lib/terminal-launch.ts',
    '../lib/terminal-size.ts',
  ];
  const sources = await Promise.all(sourceFiles.map((name) => readFile(new URL(name, import.meta.url), 'utf8')));
  const workspace = await readFile(new URL('../lib/workspace.ts', import.meta.url), 'utf8');
  sources.push(
    workspace.slice(
      workspace.indexOf('export function terminalJob'),
      workspace.indexOf('export async function', workspace.indexOf('export function stopCommand')),
    ),
  );
  const keys = [
    ...new Set(
      sources.flatMap((source) =>
        [...source.matchAll(/(?:\bt|Error|fail|setError)\(['"]([^'"\n]+)['"]/g)].map((match) => match[1]),
      ),
    ),
  ].filter((key) => /[가-힣]/.test(key));
  assert(keys.length >= 35);
  for (const locale of ['en', 'ja', 'zh', 'de', 'fr', 'es', 'ru', 'ar']) {
    const catalog = JSON.parse(await readFile(new URL('../lib/locales/' + locale + '.json', import.meta.url), 'utf8'));
    for (const key of keys) {
      assert(typeof catalog[key] === 'string' && catalog[key].trim() && catalog[key] !== key, locale + ': ' + key);
      for (const number of key.match(/\d+/g) || [])
        assert(catalog[key].includes(number), locale + ' lost limit ' + number);
      if (key.includes('LINUX_ENABLE_TERMINAL=true')) assert(catalog[key].includes('LINUX_ENABLE_TERMINAL=true'));
    }
  }
});

import { nginxPresets } from '../lib/nginx-presets.ts';
import { nginxSettingInfo, nginxBlockInfo, nginxSettingMatches } from '../lib/nginx-setting-info.ts';
import { translate } from '../lib/i18n.ts';
test('Japanese nginx help covers offered block contexts and installed TLS, realip and FastCGI directives', async () => {
  const catalog = JSON.parse(await readFile(new URL('../lib/locales/ja.json', import.meta.url), 'utf8'));
  const check = (info) => {
    assert.notEqual(info.unknown, true);
    assert(catalog[info.description]?.trim(), info.description);
    assert.notEqual(catalog[info.description], info.description);
    assert(!/[가-힣]/.test(catalog[info.description]));
    for (const number of info.description.match(/\d+(?:\.\d+)*/g) || [])
      assert(catalog[info.description].includes(number), info.description + ' lost ' + number);
  };
  for (const context of [
    'main',
    'events',
    'http',
    'server',
    'location',
    'upstream',
    'stream:stream',
    'stream:server',
    'stream:upstream',
    'mail:mail',
    'mail:server',
  ]) {
    for (const item of nginxPresets(null, { name: 'nginx.conf' }, context))
      check(item.kind === 'block' ? nginxBlockInfo(item.name, context) : nginxSettingInfo(item.name, context));
  }
  for (const name of [
    'ssl_stapling_verify',
    'ssl_client_certificate',
    'ssl_verify_depth',
    'ssl_buffer_size',
    'set_real_ip_from',
    'real_ip_header',
    'real_ip_recursive',
    'rewrite_log',
    'uninitialized_variable_warn',
    'worker_cpu_affinity',
    'proxy_ssl_name',
    'allow',
    'deny',
    'fastcgi_param',
    'fastcgi_index',
    'fastcgi_split_path_info',
  ])
    check(nginxSettingInfo(name, 'server'));
  for (const name of ['map', 'geo', 'if', 'limit_except']) check(nginxBlockInfo(name));
  assert.equal(
    nginxSettingMatches('proxy_connect_timeout', '60s', '接続確立', (text) => translate('ja', text), 'location'),
    true,
  );
  assert.equal(
    nginxSettingMatches('ssl_stapling_verify', 'on', '署名', (text) => translate('ja', text), 'server'),
    true,
  );
  for (const [name, context, term] of [
    ['resolver', 'stream:upstream', '1.27.3'],
    ['proxy_ssl_name', 'location', 'proxy_ssl_server_name'],
    ['fastcgi_index', 'location', '$fastcgi_script_name'],
  ])
    assert(catalog[nginxSettingInfo(name, context).description].includes(term));
});
