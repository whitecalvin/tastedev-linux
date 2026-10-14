(() => {
  let saved = null,
    systemDark = false;
  try {
    saved = localStorage.getItem('linux-theme');
  } catch {}
  try {
    systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {}
  document.documentElement.dataset.theme = saved === 'dark' || (saved !== 'light' && systemDark) ? 'dark' : 'light';
})();
