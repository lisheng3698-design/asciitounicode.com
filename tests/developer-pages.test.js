const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = process.cwd();
const slugs = [
  'base64-to-base64url', 'base64url-to-base64', 'unicode-character-counter', 'case-converter', 'html-encoder',
  'html-decoder', 'unicode-character-inspector', 'utf8-encoder', 'utf8-decoder', 'remove-duplicate-words',
  'sort-words', 'line-counter', 'query-string-parser', 'query-string-builder', 'json-minifier',
];

test('2026-11-09 developer pages have unique SEO, crawl paths and visible deep content', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const titles = new Set();
  const descriptions = new Set();
  for (const slug of slugs) {
    const html = fs.readFileSync(path.join(root, slug, 'index.html'), 'utf8');
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
    assert.ok(title && !titles.has(title), `${slug}: unique title`);
    assert.ok(description && !descriptions.has(description), `${slug}: unique description`);
    titles.add(title);
    descriptions.add(description);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${slug}: one H1`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://asciitounicode\\.com/${slug}/">`));
    assert.match(html, /<meta name="robots" content="index, follow">/);
    assert.match(html, /"@type":"WebApplication"/);
    assert.match(html, /"@type":"Article"/);
    assert.match(html, /<h2\b/);
    assert.match(html, /<h3\b/);
    assert.match(html, /<table\b/);
    assert.match(html, /<pre><code>/);
    assert.match(html, /developer-page-translations\.js/);
    assert.match(html, /developer-tools\.js/);
    assert.match(home, new RegExp(`href="${slug}/"`));
    assert.match(sitemap, new RegExp(`<loc>https://asciitounicode\\.com/${slug}/</loc><lastmod>2026-11-09</lastmod>`));
  }
});

test('developer page translations cover all fifteen pages in eight languages', () => {
  const languages = ['en', 'zh', 'es', 'pt', 'fr', 'de', 'ja', 'ko'];
  const context = vm.createContext({ window: { asciiUnicodeI18n: { pages: {}, meta: {}, home: Object.fromEntries(languages.map(lang => [lang, {}])) } } });
  vm.runInContext(fs.readFileSync(path.join(root, 'developer-page-translations.js'), 'utf8'), context);
  const pack = context.window.asciiUnicodeI18n;
  assert.equal(Object.keys(pack.pages).length, 15);
  for (const [key, page] of Object.entries(pack.pages)) {
    assert.deepEqual(Object.keys(page), languages, `${key}: language list`);
    for (const lang of languages) {
      assert.ok(page[lang].heroTitle);
      assert.ok(page[lang].heroLede);
      assert.ok(page[lang].warningJsonSyntax);
      assert.ok(pack.meta[key][lang].title);
      assert.ok(pack.meta[key][lang].description);
    }
  }
});
