'use client';
import { useLanguage } from './language-provider';
import { useEffect, useState, useRef } from 'react';
export default function ThemePicker() {
  const { t } = useLanguage();
  const [dark, setDark] = useState(false);
  const choice = useRef<string | null | undefined>(null);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      let saved = choice.current;
      if (saved === null)
        try {
          saved = localStorage.getItem('linux-theme');
        } catch {
          saved = document.documentElement.dataset.theme;
        }
      const value = saved === 'dark' || (saved !== 'light' && media.matches);
      setDark(value);
      document.documentElement.dataset.theme = value ? 'dark' : 'light';
    };
    const storage = (event: StorageEvent) => {
      if (event.key === 'linux-theme' || event.key === null) {
        choice.current = null;
        apply();
      }
    };
    apply();
    media.addEventListener('change', apply);
    window.addEventListener('storage', storage);
    return () => {
      media.removeEventListener('change', apply);
      window.removeEventListener('storage', storage);
    };
  }, []);
  function toggle() {
    const next = !dark,
      value = next ? 'dark' : 'light';
    choice.current = value;
    setDark(next);
    document.documentElement.dataset.theme = value;
    try {
      localStorage.setItem('linux-theme', value);
    } catch {}
  }
  const label = dark ? t('밝은 테마로 전환') : t('어두운 테마로 전환');
  return (
    <button
      type='button'
      className='theme-toggle'
      aria-label={label}
      title={label}
      aria-pressed={dark}
      onClick={toggle}
    >
      <svg
        aria-hidden='true'
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.7'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        {dark ? (
          <>
            <circle cx='12' cy='12' r='4' />
            <path d='M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5' />
          </>
        ) : (
          <path d='M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z' />
        )}
      </svg>
    </button>
  );
}
