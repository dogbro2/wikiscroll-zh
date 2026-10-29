/* Loads the interface dictionary for one language (public/translations/<lang>.js),
   so each reader downloads only the language they use. It runs in <head> to start
   the reader's saved language while the page is still parsing; i18n.js applies the
   dictionary as soon as it arrives. Bump VERSION when any dictionary changes, and
   update the matching entries in the service worker's SHELL. */
(() => {
  const VERSION = 19;
  const pending = {};
  function load(lang) {
    if (lang === 'en' || !/^[a-z]{2}$/.test(lang)) return Promise.resolve(false);
    if (window.WS_TRANSLATIONS?.[lang]) return Promise.resolve(true);
    return pending[lang] ||= new Promise(resolve => {
      const script = document.createElement('script');
      script.src = `/translations/${lang}.js?v=${VERSION}`;
      script.onload = () => resolve(!!window.WS_TRANSLATIONS?.[lang]);
      script.onerror = () => { delete pending[lang]; script.remove(); resolve(false); };
      document.head.append(script);
    });
  }
  window.WSTranslations = {load};
  // Same precedence as the app (see pickLang in app.js): ?lang= wins, then the
  // saved setting, then the browser's own preferences, then English. This runs
  // in <head>, before the app, so a Chinese reader's first visit starts in
  // Chinese instead of showing the English interface until the app boots.
  // The list mirrors LANGS in app.js; test/language.test.js fails if they drift.
  const LANGS = 'en es fr de it pt ru ja zh ar hi ko he nl pl'.split(' ');
  const picks = code => typeof code === 'string' && LANGS.includes(code);
  const pick = () => {
    const asked = new URLSearchParams(location.search).get('lang');
    if (picks(asked)) return asked;
    let saved;
    try { saved = JSON.parse(localStorage.getItem('ws_settings'))?.lang; } catch {}
    if (picks(saved)) return saved;
    const nav = globalThis.navigator, tags = nav?.languages?.length ? nav.languages : [nav?.language];
    for (const tag of tags) {
      const code = String(tag || '').toLowerCase().split('-')[0];
      // Safari before 15 asked for Hebrew as "iw"; the tag is the old code.
      const alias = code === 'iw' ? 'he' : code;
      if (picks(alias)) return alias;
    }
    return 'en';
  };
  const lang = pick();
  document.documentElement.lang = lang;
  if (lang !== 'en') {
    // Keep the page hidden until i18n.js has applied the dictionary, so a
    // non-English reader never sees the English interface first. The timeout
    // shows the page anyway if anything goes wrong.
    const root = document.documentElement;
    root.classList.add('i18n-pending');
    setTimeout(() => root.classList.remove('i18n-pending'), 1500);
    load(lang);
  }
})();
