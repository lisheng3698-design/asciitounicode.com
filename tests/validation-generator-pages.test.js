const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const root = process.cwd();
const slugs = [
  'uuid-generator', 'json-validator', 'regex-tester', 'xml-validator', 'email-extractor',
  'url-extractor', 'remove-line-breaks', 'find-and-replace-text', 'random-string-generator',
  'password-generator', 'json-escape', 'json-unescape', 'random-number-generator',
  'csv-validator', 'xml-escape',
];

function loadConverters() {
  const context = vm.createContext({
    window: {}, TextEncoder, TextDecoder, URL, Intl, atob, btoa, crypto: webcrypto,
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'advanced-tools.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'validation-tools.js'), 'utf8'), context);
  return context.window.asciiUnicodeUtilities.converters;
}

test('2026-11-11 converters cover normal, boundary and invalid inputs', () => {
  const run = (slug, input, format) => loadConverters()[slug](input, format);
  assert.match(run('uuid-generator', '2', 'uuid-v4').output, /^[0-9a-f-]{36}\n[0-9a-f-]{36}$/);
  assert.ok(run('uuid-generator', '0', 'uuid-v4').warning);
  assert.equal(JSON.parse(run('json-validator', '{"a":1}', 'json-report').output).valid, true);
  assert.ok(run('json-validator', '{"a":}', 'json-report').warning);
  assert.equal(JSON.parse(run('regex-tester', 'a+\n---TEXT---\ncaaab', 'regex-global').output).matches[0].match, 'aaa');
  assert.ok(run('regex-tester', '[\n---TEXT---\nx', 'regex-global').warning);
  assert.equal(JSON.parse(run('xml-validator', '<root><item/></root>', 'xml-report').output).root, 'root');
  assert.ok(run('xml-validator', '<!DOCTYPE root><root/>', 'xml-report').warning);
  assert.equal(run('email-extractor', 'A@example.com a@example.com b@test.org', 'extract-email-fold').output, 'A@example.com\nb@test.org');
  assert.equal(run('url-extractor', 'See https://example.com/a?q=1 and http://test.org.', 'extract-url-unique').output, 'https://example.com/a?q=1\nhttp://test.org/');
  assert.equal(run('remove-line-breaks', 'a\r\n b\n\nc', 'join-lines-space').output, 'a b c');
  assert.equal(run('remove-line-breaks', 'a\nb', 'join-lines-empty').output, 'ab');
  assert.equal(run('find-and-replace-text', 'cat\n---REPLACE---\ndog\n---TEXT---\ncat cat', 'replace-literal-all').output, 'dog dog');
  assert.ok(run('find-and-replace-text', '[\n---REPLACE---\nx\n---TEXT---\ny', 'replace-regex-all').warning);
  assert.match(run('random-string-generator', '16', 'random-alphanumeric').output, /^[A-Za-z0-9]{16}$/);
  assert.ok(run('random-string-generator', '0', 'random-alphanumeric').warning);
  assert.match(run('password-generator', '20', 'password-strong').output, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{20}$/);
  assert.ok(run('password-generator', '3', 'password-strong').warning);
  assert.equal(run('json-escape', 'line\n"x"', 'json-string').output, '"line\\n\\"x\\""');
  assert.equal(run('json-unescape', '"line\\n\\"x\\""', 'json-text').output, 'line\n"x"');
  assert.ok(run('json-unescape', '{"a":1}', 'json-text').warning);
  const numbers = run('random-number-generator', '1,3,20', 'random-integers').output.split('\n').map(Number);
  assert.equal(numbers.length, 20);
  assert.ok(numbers.every(value => value >= 1 && value <= 3));
  assert.ok(run('random-number-generator', '3,1,1', 'random-integers').warning);
  assert.equal(JSON.parse(run('csv-validator', 'a,b\r\n"c,d",e', 'csv-report').output).columns, 2);
  assert.ok(run('csv-validator', 'a,b\n"c,d', 'csv-report').warning);
  assert.equal(run('xml-escape', '<tag a="x">&</tag>', 'xml-text-escape').output, '&lt;tag a="x"&gt;&amp;&lt;/tag&gt;');
  assert.equal(run('xml-escape', '<tag a="x">&</tag>', 'xml-attribute-escape').output, '&lt;tag a=&quot;x&quot;&gt;&amp;&lt;/tag&gt;');
});

test('2026-11-11 pages expose unique source SEO, tools, crawl paths and eight locales', () => {
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
    titles.add(title); descriptions.add(description);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${slug}: one H1`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://asciitounicode\\.com/${slug}/">`));
    assert.match(html, /<meta name="robots" content="index, follow">/);
    assert.match(html, /"@type":"WebApplication"/);
    assert.match(html, /"@type":"Article"/);
    assert.match(html, /<h2\b/);
    assert.match(html, /<h3\b/);
    assert.match(html, /<table\b/);
    assert.match(html, /<pre><code>/);
    assert.match(html, /validation-page-translations\.js/);
    assert.match(html, /validation-tools\.js/);
    assert.match(home, new RegExp(`href="${slug}/"`));
    assert.match(sitemap, new RegExp(`<loc>https://asciitounicode\\.com/${slug}/</loc><lastmod>2026-11-11</lastmod>`));
  }
  const context = vm.createContext({ window: { asciiUnicodeI18n: { pages: {}, meta: {}, home: { en:{},zh:{},es:{},pt:{},fr:{},de:{},ja:{},ko:{} } } } });
  vm.runInContext(fs.readFileSync(path.join(root, 'validation-page-translations.js'), 'utf8'), context);
  for (const page of Object.values(context.window.asciiUnicodeI18n.pages)) {
    assert.deepEqual(Object.keys(page), ['en','zh','es','pt','fr','de','ja','ko']);
    for (const locale of Object.values(page)) {
      assert.ok(locale.heroTitle && locale.heroLede && locale.warningValidation);
    }
  }
  assert.equal(Object.keys(context.window.asciiUnicodeI18n.pages).length, 15);
});
