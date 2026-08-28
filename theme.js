(() => {
  const KEY = 'aldeckot-theme-preference';

  function apply(theme) {
    const light = theme === 'light';
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    document.body.classList.toggle('theme-light', light);
    const switcher = document.getElementById('themeSwitch');
    if (switcher) switcher.checked = light;
  }

  let preference = 'dark';
  try { preference = localStorage.getItem(KEY) || 'dark'; } catch { /* armazenamento indisponível */ }
  apply(preference);

  const switcher = document.getElementById('themeSwitch');
  if (switcher) {
    switcher.addEventListener('change', () => {
      const theme = switcher.checked ? 'light' : 'dark';
      try { localStorage.setItem(KEY, theme); } catch { /* armazenamento indisponível */ }
      apply(theme);
    });
  }

  window.addEventListener('storage', event => {
    if (event.key === KEY) apply(event.newValue || 'dark');
  });
})();
