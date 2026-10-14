import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transform, loadBindings } from 'next/dist/build/swc/index.js';
import en from '../lib/locales/en.json' with { type: 'json' };
import tr from '../lib/locales/tr.json' with { type: 'json' };
import { translate } from '../lib/i18n.ts';
test('login and code editors have direct Turkish translations including trimmed action labels', async () => {
  const texts = new Set();
  for (const file of ['login-screen.tsx', 'ide-editor.tsx', 'config-code-editor.tsx', 'nginx-code-editor.tsx']) {
    const source = await readFile(new URL('../components/' + file, import.meta.url), 'utf8');
    for (const match of source.matchAll(/(['"])([^'"\r\n]*[가-힣][^'"\r\n]*)\1/g))
      if (Object.hasOwn(en, match[2].trim())) texts.add(match[2]);
  }
  assert(texts.has('저장하지 않은 변경을 버리고 {name} 탭을 닫을까요?'));
  assert(texts.has('디스크 파일 비교 · '));
  assert(texts.has('인증 저장소를 사용할 수 없습니다.'));
  for (const text of texts) {
    const key = text.trim();
    assert(Object.hasOwn(tr, key), 'Missing: ' + key);
    assert.equal(translate('tr-TR', text), text.replace(key, tr[key]));
  }
  assert.equal(
    translate('tr', '저장하지 않은 변경을 버리고 {name} 탭을 닫을까요?', { name: 'nginx.conf' }),
    'Kaydedilmemiş değişiklikleri atıp nginx.conf sekmesini kapatmak istiyor musunuz?',
  );
});
test('actual login component SSR renders Turkish storage guidance and labels without API calls', async () => {
  await loadBindings();
  const compiled = await transform(await readFile(new URL('../components/login-screen.tsx', import.meta.url), 'utf8'), {
    filename: 'login-screen.tsx',
    jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  });
  const native = createRequire(import.meta.url),
    module = { exports: {} };
  const controls = {
    Button: (props) => React.createElement('button', { disabled: props.disabled }, props.children),
    TextInput: (props) => React.createElement('label', null, props.label),
  };
  const require = (name) => name === './ui/toast-provider' ? toastTestModuleWithReact(React) :
    name === './language-provider'
      ? { useLanguage: () => ({ t: (text) => translate('tr-TR', text) }), LanguagePicker: () => null }
      : name === 'next/navigation'
        ? { useRouter: () => ({}) }
        : name === './draft-provider'
          ? { useClearDrafts: () => () => {} }
          : name === './theme-picker'
            ? { __esModule: true, default: () => null }
            : name === './ui/controls'
              ? controls
              : native(name);
  new Function('require', 'module', 'exports', compiled.code)(require, module, module.exports);
  const original = globalThis.fetch;
  globalThis.fetch = () => assert.fail('SSR must not call browser login API');
  try {
    const html = renderToStaticMarkup(
      React.createElement(module.exports.default, { setupDirectory: '/tmp/fixture', storageUnavailable: true }),
    );
    assert(html.includes('Yönetici girişi'));
    assert(html.includes('Kimlik doğrulama deposu kullanılamıyor'));
    assert(html.includes('0700'));
    assert(html.includes('0600'));
    assert(html.includes('LINUX_AUTH_ROOT'));
    assert(!/[가-힣]/.test(html));
  } finally {
    globalThis.fetch = original;
  }
});
