import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cookieSession } from '../../lib/auth.ts';
import { loginDestination } from '../../lib/login-destination.ts';
import LoginScreen from '../../components/login-screen';
import { isAuthStorageError } from '../../lib/auth-storage-error.ts';
export const dynamic = 'force-dynamic';
type LoginPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function Page({ searchParams }: LoginPageProps) {
  const incoming = await headers();
  let session,
    storageUnavailable = false;
  try {
    session = await cookieSession({ headers: incoming });
  } catch (error) {
    if (!isAuthStorageError(error)) throw error;
    storageUnavailable = true;
  }
  if (session) {
    const query = await searchParams;
    redirect(loginDestination(query?.next));
  }
  return (
    <LoginScreen
      setupDirectory={process.cwd()}
      packaged={process.env.LINUX_PACKAGED === 'true'}
      storageUnavailable={storageUnavailable}
    />
  );
}
