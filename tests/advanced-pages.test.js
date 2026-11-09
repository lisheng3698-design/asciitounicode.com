const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = process.cwd();
const slugs = [
  'json-formatter', 'url-parser', 'punycode-converter', 'xml-formatter', 'json-to-xml',
  'xml-to-json', 'text-compare', 'jwt-decoder', 'hash-generator', 'unix-timestamp-converter',
  'word-frequency-counter', 'remove-empty-lines', 'add-line-numbers', 'reverse-lines', 'duplicate-line-finder',
];

test('2026-11-10 advanced pages have unique SEO, real scripts, crawl paths and deep source content', () => {
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
    assert.match(html, /advanced-page-translations\.js/);
    assert.match(html, /advanced-tools\.js/);
    assert.match(html, /developer-tools\.js/);
    assert.match(home, new RegExp(`href="${slug}/"`));
    assert.match(sitemap, new RegExp(`<loc>https://asciitounicode\\.com/${slug}/</loc><lastmod>2026-11-10</lastmod>`));
  }
});

test('advanced page translations cover fifteen pages in eight languages and all runtime warnings', () => {
  const languages = ['en', 'zh', 'es', 'pt', 'fr', 'de', 'ja', 'ko'];
  const context = vm.createContext({ window: { asciiUnicodeI18n: { pages: {}, meta: {}, home: Object.fromEntries(languages.map(lang => [lang, {}])) } } });
  vm.runInContext(fs.readFileSync(path.join(root, 'advanced-page-translations.js'), 'utf8'), context);
  const pack = context.window.asciiUnicodeI18n;
  assert.equal(Object.keys(pack.pages).length, 15);
  for (const [key, page] of Object.entries(pack.pages)) {
    assert.deepEqual(Object.keys(page), languages, `${key}: language list`);
    for (const lang of languages) {
      assert.ok(page[lang].heroTitle);
      assert.ok(page[lang].heroLede);
      assert.ok(page[lang].warningXmlSyntax);
      assert.ok(page[lang].warningJwtUnverified);
      assert.ok(page[lang].warningTimestamp);
      assert.ok(pack.meta[key][lang].title);
      assert.ok(pack.meta[key][lang].description);
    }
  }
});
