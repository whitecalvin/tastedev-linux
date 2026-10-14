export const authStorageMessage =
  '인증 저장소를 사용할 수 없습니다. LINUX_AUTH_ROOT와 폴더 0700·파일 0600 권한을 확인하세요.';
export function isAuthStorageError(error: unknown): boolean {
  if(!error||typeof error!=='object')return false;
  const code='code' in error&&typeof error.code==='string'?error.code:'';
  const message='message' in error&&typeof error.message==='string'?error.message:'';
  return (
    ['EACCES', 'EPERM', 'EROFS', 'ENOTDIR', 'EEXIST', 'SQLITE_CANTOPEN'].includes(code) ||
    [
      '인증 저장 경로 권한을 확인하세요.',
      '인증 저장 파일 권한을 확인하세요.',
      '계정 저장 경로를 확인하세요.',
      '계정 설정 파일을 확인하세요.',
      '인증 키를 확인하세요.',
    ].includes(message)
  );
}
