import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { transform, loadBindings } from 'next/dist/build/swc/index.js';
test('Theme toggle survives blocked storage, preserves a manual choice and synchronizes storage events', async () => {
  const source = await readFile(new URL('../components/theme-picker.tsx', import.meta.url), 'utf8');
  await loadBindings();
  const compiled = await transform(source, {
    filename: 'theme-picker.tsx',
    jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  });
  const native = createRequire(import.meta.url);
  for (const blockedRead of [false, true]) {
    const module = { exports: {} },
      document = { documentElement: { dataset: { theme: 'light' } } },
      callbacks = new Map();
    let saved = 'light',
      cleanup,
      state;
    const media = {
      matches: false,
      addEventListener: (name, fn) => callbacks.set('media', fn),
      removeEventListener: () => callbacks.delete('media'),
    };
    const window = {
      addEventListener: (name, fn) => callbacks.set(name, fn),
      removeEventListener: (name) => callbacks.delete(name),
    };
    const storage = {
      getItem: () => {
        if (blockedRead) throw Error('fixture storage denied');
        return saved;
      },
      setItem: () => {
        throw Error('fixture storage full');
      },
    };
    const require = (name) =>
      name === 'react'
        ? {
            useState: (initial) => [
              initial,
              (value) => {
                state = value;
              },
            ],
            useRef: (initial) => ({ current: initial }),
            useEffect: (fn) => {
              cleanup = fn();
            },
          }
        : name === './language-provider'
          ? { useLanguage: () => ({ t: (text) => text }) }
          : native(name);
    new Function('require', 'module', 'exports', 'localStorage', 'matchMedia', 'document', 'window', compiled.code)(
      require,
      module,
      module.exports,
      storage,
      () => media,
      document,
      window,
    );
    const button = module.exports.default();
    assert.equal(document.documentElement.dataset.theme, 'light');
    button.props.onClick();
    assert.equal(document.documentElement.dataset.theme, 'dark');
    assert.equal(state, true);
    callbacks.get('media')();
    assert.equal(document.documentElement.dataset.theme, 'dark');
    if (!blockedRead) {
      saved = 'light';
      callbacks.get('storage')({ key: 'unrelated' });
      assert.equal(document.documentElement.dataset.theme, 'dark');
      callbacks.get('storage')({ key: 'linux-theme' });
      assert.equal(document.documentElement.dataset.theme, 'light');
    }
    cleanup();
    assert.equal(callbacks.size, 0);
  }
});
