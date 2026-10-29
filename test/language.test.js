import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// The interface language follows, in order: ?lang=, the saved setting, the
// browser's own preferences, English. app.js decides it for the feed and
// lang.js (which runs in <head>) decides it for the dictionary; both must agree.

const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const langSource = fs.readFileSync(new URL('../public/lang.js', import.meta.url), 'utf8');

const cases = [
  ['', undefined, ['zh-TW', 'en-US'], 'zh'],
  ['', undefined, ['zh-Hant-TW'], 'zh'],
  ['', undefined, ['ja'], 'ja'],
  ['', undefined, ['fr-CA', 'en'], 'fr'],
  ['?lang=fr', undefined, ['zh-TW'], 'fr'],
  ['?lang=xx', undefined, ['zh-TW'], 'zh'],
  ['?lang=xx', 'de', ['zh-TW'], 'de'],
  ['?lang=', undefined, ['ko'], 'ko'],
  ['', 'en', ['zh-TW'], 'en'],
  ['', 'pt', ['zh-TW'], 'pt'],
  ['', undefined, ['iw-IL'], 'he'],
  ['', undefined, ['nb-NO', 'pl-PL'], 'pl'],
  ['', undefined, [], 'en'],
  ['', undefined, ['la', 'hi-IN'], 'hi'],
  ['', undefined, ['ar-SA'], 'ar'],
];

function appPicker() {
  const start = app.indexOf('function browserLang(');
  const end = app.indexOf('// Chinese Wikipedia and Wikivoyage keep each article');
  const langs = [...app.matchAll(/\{c:'([a-z]{2})',n:'/g)].map(m => m[1]);
  const context = vm.createContext({LANGS: langs.map(c => ({c})), URLSearchParams, navigator: {language: 'en'}});
  vm.runInContext(app.slice(start, end), context);
  return context.pickLang;
}

// lang.js is an IIFE that touches just enough DOM to load one dictionary.
function langPicker({search, saved, languages}) {
  const loaded = [], classes = new Set();
  const context = vm.createContext({
    JSON, Promise, URLSearchParams, setTimeout: () => {},
    location: {search},
    localStorage: {getItem: key => key === 'ws_settings' && saved !== undefined ? JSON.stringify({lang: saved}) : null},
    navigator: {languages, language: languages[0]},
    document: {
      documentElement: {classList: {add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c)}, lang: 'en'},
      head: {append: script => loaded.push(script.src)},
      createElement: () => ({}),
    },
    window: {},
  });
  vm.runInContext(langSource, context);
  return {loaded, classes, htmlLang: context.document.documentElement.lang};
}

test('the two language lists mirror each other', () => {
  const appLangs = [...app.matchAll(/\{c:'([a-z]{2})',n:'/g)].map(m => m[1]).sort();
  const listLine = langSource.match(/const LANGS = '([a-z ]+)'\.split\(' '\)/)[1].split(' ');
  assert.deepEqual([...listLine].sort(), appLangs);
});

test('the app follows ?lang=, then the saved setting, then the browser', () => {
  const pick = appPicker();
  for (const [search, saved, languages, expected] of cases) {
    assert.equal(pick(search, saved, {languages, language: languages[0]}), expected, `${search}|${saved}|${languages}`);
  }
});

test('the head script loads the same language the app will use', () => {
  const pick = appPicker();
  for (const [search, saved, languages, expected] of cases) {
    const {loaded, classes, htmlLang} = langPicker({search, saved, languages});
    assert.equal(pick(search, saved, {languages, language: languages[0]}), expected, `app ${search}|${saved}|${languages}`);
    assert.equal(htmlLang, expected, `html lang ${search}|${saved}|${languages}`);
    if (expected === 'en') {
      assert.deepEqual(loaded, [], 'English needs no dictionary');
      assert.ok(!classes.has('i18n-pending'), 'English shows immediately');
    } else {
      assert.deepEqual(loaded, [`/translations/${expected}.js?v=19`]);
      assert.ok(classes.has('i18n-pending'), 'the page waits for its dictionary');
    }
  }
});

test('an unknown browser language falls back to English', () => {
  const {loaded, htmlLang} = langPicker({search: '', saved: undefined, languages: ['xx-YY', 'nb-NO']});
  assert.equal(htmlLang, 'en');
  assert.deepEqual(loaded, []);
});

test('a deep link without ?lang= stays English whatever the interface language', async () => {
  const src = app.slice(app.indexOf('async function resolveDeepLink()'), app.indexOf('async function boot()'));
  const requests = [];
  const c = vm.createContext({
    URLSearchParams, AbortSignal, console,
    LANGS: [{c: 'en'}, {c: 'zh'}], curLang: 'zh',
    variantTitleParam: lang => lang === 'zh' ? '%7Cvarianttitles' : '',
    variantParam: lang => lang === 'zh' ? '&variant=zh-tw' : '',
    variantTitle: (page, lang) => (lang === 'zh' && page?.varianttitles?.['zh-tw']) || page?.title,
    window: {location: {search: '?a=w12288061', pathname: '/'}, history: {replaceState() {}}},
    stripHtml: s => String(s || '').replace(/<[^>]+>/g, ''), toast: () => {},
    fetch: async url => {
      requests.push(new URL(url));
      return Response.json({query: {pages: {12288061: {pageid: 12288061, ns: 0, title: 'Adalrich, Duke of Alsace', extract: 'Adalrich was the Duke of Alsace and founder of the Etichonids.', description: 'Frankish duke'}}}});
    },
  });
  vm.runInContext(src, c);
  const article = await c.resolveDeepLink();
  assert.equal(requests[0].host, 'en.wikipedia.org', 'an id is unique to one edition');
  assert.equal(requests[0].searchParams.get('variant'), null, 'English needs no variant');
  assert.equal(article.title, 'Adalrich, Duke of Alsace');
});