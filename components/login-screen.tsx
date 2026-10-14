'use client';
import {ToastNotice,useFeedback} from './ui/toast-provider';
import { loginDestination } from '../lib/login-destination.ts';
import { useClearDrafts } from './draft-provider';
import { useLanguage } from './language-provider';
import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, IconButton, TextInput } from './ui/controls';
import ThemePicker from './theme-picker';
import { LanguagePicker } from './language-provider';
type LoginScreenProps = { setupDirectory: string; packaged: boolean; storageUnavailable?: boolean };
type LoginStatus = { configured?: boolean | null; authenticated?: boolean; storageUnavailable?: boolean };
export default function LoginScreen({ setupDirectory, packaged, storageUnavailable = false }: LoginScreenProps) {
  const { t } = useLanguage();
  const clearDrafts = useClearDrafts();
  useEffect(() => {
    if (!storageUnavailable) clearDrafts();
  }, [clearDrafts, storageUnavailable]);
  const router = useRouter();
  const [username, setUsername] = useState(''),
    [password, setPassword] = useState(''),
    [loginState, setLoginState] = useState<LoginStatus | null>(storageUnavailable ? { storageUnavailable: true } : null),
    [loading, setLoading] = useState(false),
    [message,setMessage,messageKind,messageEvent]=useFeedback<string>('');
  const [destination, setDestination] = useState('/overview');
  const [commandCopied, setCommandCopied] = useState(false);
  const setupCommand = packaged
    ? 'sudo tastedev-linux account setup'
    : "cd '" + setupDirectory.replaceAll("'", "'\"'\"'") + "'\nnpm run account:setup";
  async function copySetupCommand() {
    try {
      await navigator.clipboard.writeText(setupCommand);
      setCommandCopied(true);
    } catch {
      setCommandCopied(false);
      setMessage('클립보드 접근에 실패했습니다. 브라우저 권한을 확인하세요.', 'error');
    }
  }
  const submitting = useRef(false),
    unavailable = storageUnavailable || loginState?.storageUnavailable;
  useEffect(() => {
    let cancelled = false;
    const target = loginDestination(new URLSearchParams(window.location.search).get('next'));
    setDestination(target);
    fetch('/api/auth/status', { cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok && !data.storageUnavailable) throw Error();
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setLoginState(data);
        if (data.authenticated === true) {
          router.replace(target);
          router.refresh();
        }
      })
      .catch(() => {
        if (!cancelled) setMessage('로그인 상태를 확인할 수 없습니다.', 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [router]);
  async function perform(fn: () => Promise<void>) {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setMessage('');
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '로그인 실패', 'error');
    } finally {
      setPassword('');
      submitting.current = false;
      setLoading(false);
    }
  }
  return (
    <div className='console-shell auth-shell'>
      <header className='admin-topbar'>
        <a href='/' className='brand'>
          <span className='logo'>L</span> LINUX <small>Admin</small>
        </a>
        <div className='connection'>
          <LanguagePicker />
          <ThemePicker />
        </div>
      </header>
      <main className='admin-content'>
        {
          <section className='auth-welcome'>
            <span className='auth-kicker'>TASTEDEV / LINUX CONSOLE</span>
            <h1>
              {t('서버 운영을')}
              <br />
              {t('한곳에서.')}
            </h1>
            <p>
              {t('설치부터 설정, 로그와 복구까지.')}
              <br />
              {t('Linux 서버를 위한 관리 워크스페이스.')}
            </p>
            <div className='auth-features'>
              <span>
                01 <strong>{t('운영 관리')}</strong>
                <small>{t('nginx · HTTPS · cron · 데몬')}</small>
              </span>
              <span>
                02 <strong>{t('설정 워크스페이스')}</strong>
                <small>{t('패키지별 GUI IDE · 터미널')}</small>
              </span>
              <span>
                03 <strong>{t('문제 해결')}</strong>
                <small>{t('로그 분석 · AI 도우미 · 복구')}</small>
              </span>
            </div>
            <span className='auth-local'>{t('● 로컬 서버 콘솔')}</span>
          </section>
        }
        {
          <form
            className='login'
            onSubmit={(e) => {
              e.preventDefault();
              if (unavailable) return;
              perform(async () => {
                const response = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username, password }),
                });
                const data = await response.json();
                setPassword('');
                if (!response.ok) throw new Error(data.error || '로그인 실패');
                router.replace(destination);
                router.refresh();
              });
            }}
          >
            <span className='auth-kicker'>SECURE ACCESS</span>
            <h2>{t('관리자 로그인')}</h2>
            <p className='hint'>{t('로그인 후 서버 관리 기능을 사용할 수 있습니다.')}</p>
            <div>
              <TextInput
                disabled={loading || unavailable}
                label={t('사용자명')}
                autoComplete='username'
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                required
              />
              <TextInput
                disabled={loading || unavailable}
                label={t('비밀번호')}
                type='password'
                autoComplete='current-password'
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
              <Button type='submit' disabled={unavailable} loading={loading}>
                {t('로그인')}
              </Button>
            </div>
            {unavailable && (
              <div className='auth-setup' role='alert'>
                <strong>{t('인증 저장소를 사용할 수 없습니다.')}</strong>
                <p>
                  {t(
                    'LINUX_AUTH_ROOT를 권한 설정이 가능한 저장소로 지정하세요. 폴더는 0700, 파일은 0600이어야 합니다.',
                  )}
                </p>
                <p>
                  {t(
                    'exFAT 작업 디스크에서는 사용자 홈의 비공개 폴더를 사용하세요. 기존 계정과 인증 파일은 보존해야 합니다.',
                  )}
                </p>
              </div>
            )}
            {!unavailable && loginState?.configured === false && (
              <div className='auth-setup'>
                <strong>{t('처음 사용하시나요?')}</strong>
                <p>{t('서버 터미널에서 관리자 계정을 생성하세요.')}</p>
                <div className='setup-command-row'>
                  <code className='setup-command'>{setupCommand}</code>
                  <IconButton variant='ghost' className='setup-command-copy' aria-label={t('명령어 복사')} title={t('명령어 복사')} onClick={copySetupCommand}>
                    <svg viewBox='0 0 24 24' aria-hidden='true'><path d={commandCopied ? 'm5 12 4 4L19 6' : 'M9 9h11v11H9z M15 5V3H3v12h2'} /></svg>
                  </IconButton>
                </div>
              </div>
            )}
          </form>
        }
        <ToastNotice message={t(message)} kind={messageKind} eventId={messageEvent}/>
      </main>
    </div>
  );
}
