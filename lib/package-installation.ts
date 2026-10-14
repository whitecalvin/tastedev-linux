// Node distributions may bundle npm in nodejs rather than install Debian's npm
// package. The installed Node runtime must remain manageable in that case.
export function packageGroupInstalled(id: string, packages: readonly {name: string; installed: boolean}[]): boolean {
  if (id === 'nodejs') return packages.some(row => row.name === 'nodejs' && row.installed === true);
  return packages.length > 0 && packages.every(row => row.installed === true);
}
