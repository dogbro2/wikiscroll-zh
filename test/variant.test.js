import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {variantParams, variantTitleProp, variantTitle} from '../worker/variant.js';

test('Chinese requests ask for the Taiwan variant; other languages never do', () => {
  assert.deepEqual(variantParams('zh'), {variant: 'zh-tw'});
  for (const lang of ['en', 'ja', 'de', 'pt', 'zh-min-nan']) assert.deepEqual(variantParams(lang), {});
});

test('the title property is only added for Chinese', () => {
  assert.equal(variantTitleProp('zh', 'url'), 'url|varianttitles');
  assert.equal(variantTitleProp('zh', 'url|talkid'), 'url|talkid|varianttitles');
  assert.equal(variantTitleProp('en', 'url'), 'url');
});

test('a Chinese title comes from varianttitles, falling back to the raw title', () => {
  const page = {title: '朝鲜银行', varianttitles: {'zh-tw': '朝鮮銀行', 'zh-cn': '朝鲜银行'}};
  assert.equal(variantTitle(page, 'zh'), '朝鮮銀行');
  assert.equal(variantTitle(page, 'ja'), '朝鲜银行');
  assert.equal(variantTitle({title: '朝鲜银行'}, 'zh'), '朝鲜银行');
  assert.equal(variantTitle(undefined, 'zh'), undefined);
});

test('every Worker path that returns article text sends the variant', () => {
  for (const file of ['worker/index.js', 'worker/topics.js', 'worker/vital.js', 'worker/verified.js']) {
    const src = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    assert.match(src, /from '\.\/variant\.js'/, `${file} imports the helper`);
    assert.ok(src.includes('variantParams('), `${file} sends the variant`);
  }
});

test('the reader asks for the variant and for converted titles', () => {
  const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.match(app, /const variantParam = lang => lang === 'zh' \? '&variant=zh-tw' : ''/);
  assert.ok(app.includes('+variantParam(lang)'), 'random feed, guides and full text');
  assert.ok(app.includes('+variantTitleParam(lang)'), 'random feed and guides ask for converted titles');
  assert.ok(app.includes('variantTitleParam(lang)+variantParam(lang)'), 'shared links convert text and title');
  assert.ok(app.includes("title: variantTitle(p, lang), body: stripHtml(p.extract"), 'a shared link takes its title from varianttitles');
});

test('the reader keeps the parameter order the API accepts', () => {
  const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  // origin=* must stay the last plain parameter; varianttitles goes inside inprop.
  assert.doesNotMatch(app, /origin=\*\|\w/);
  assert.doesNotMatch(app, /inprop=url\|varianttitles/);
});