const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const root = process.cwd();
const slugs = [
  'xml-unescape', 'base64-validator', 'url-validator', 'utf-8-validator',
  'add-prefix-to-lines', 'add-suffix-to-lines', 'uuid-validator', 'hex-validator',
  'csv-formatter', 'json-flatten', 'paragraph-counter', 'number-extractor',
  'remove-punctuation', 'tsv-to-csv', 'csv-to-tsv',
];

function loadConverters() {
  const context = vm.createContext({
    window: {}, TextEncoder, TextDecoder, URL, Intl, atob, btoa, crypto: webcrypto,
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'advanced-tools.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'validation-tools.js'), 'utf8'), context);
  return context.window.asciiUnicodeUtilities.converters;
}

test('2026-11-12 converters cover normal, boundary and invalid inputs', () => {
  const run = (slug, input, format) => loadConverters()[slug](input, format);
  assert.equal(run('xml-unescape', '&lt;tag&gt;A &amp; B&lt;/tag&gt;', 'xml-unescape-strict').output, '<tag>A & B</tag>');
  assert.equal(run('xml-unescape', '&amp;lt;', 'xml-unescape-strict').output, '&lt;');
  assert.ok(run('xml-unescape', '&copy;', 'xml-unescape-strict').warning);
  assert.equal(JSON.parse(run('base64-validator', 'SGVsbG8=', 'base64-standard').output).decodedBytes, 5);
  assert.equal(JSON.parse(run('base64-validator', 'SGVsbG8', 'base64-url').output).decodedBytes, 5);
  assert.ok(run('base64-validator', 'SGVsbG8===', 'base64-standard').warning);
  assert.equal(JSON.parse(run('url-validator', 'https://example.com/a?b=1#c', 'url-http').output).hostname, 'example.com');
  assert.equal(JSON.parse(run('url-validator', 'http://localhost:8080/', 'url-http').output).port, '8080');
  assert.ok(run('url-validator', '/relative', 'url-http').warning);
  assert.equal(JSON.parse(run('utf-8-validator', '48 65 6C 6C 6F', 'utf8-hex').output).text, 'Hello');
  assert.equal(JSON.parse(run('utf-8-validator', 'F0 9F 98 80', 'utf8-hex').output).characters, 1);
  assert.ok(run('utf-8-validator', 'C0 AF', 'utf8-hex').warning);
  assert.equal(run('add-prefix-to-lines', '> \n---TEXT---\na\n\nb', 'prefix-all-lines').output, '> a\n> \n> b');
  assert.equal(run('add-prefix-to-lines', '#\n---TEXT---\n', 'prefix-all-lines').output, '#');
  assert.ok(run('add-prefix-to-lines', 'missing marker', 'prefix-all-lines').warning);
  assert.equal(run('add-suffix-to-lines', ';\n---TEXT---\na\n\nb', 'suffix-all-lines').output, 'a;\n;\nb;');
  assert.equal(run('add-suffix-to-lines', '!\n---TEXT---\n', 'suffix-all-lines').output, '!');
  assert.ok(run('add-suffix-to-lines', 'missing marker', 'suffix-all-lines').warning);
  assert.equal(JSON.parse(run('uuid-validator', '550e8400-e29b-41d4-a716-446655440000', 'uuid-report').output).version, 4);
  assert.equal(JSON.parse(run('uuid-validator', '00000000-0000-1000-8000-000000000000', 'uuid-report').output).variant, 'RFC 4122');
  assert.ok(run('uuid-validator', '{550e8400-e29b-41d4-a716-446655440000}', 'uuid-report').warning);
  assert.equal(JSON.parse(run('hex-validator', '0x48 0x65 0x6c 0x6c 0x6f', 'hex-bytes').output).normalized, '48 65 6C 6C 6F');
  assert.equal(JSON.parse(run('hex-validator', '00', 'hex-bytes').output).bytes, 1);
  assert.ok(run('hex-validator', 'ABC', 'hex-bytes').warning);
  assert.equal(run('csv-formatter', 'name,note\nAda,"a,b"', 'csv-format-crlf').output, 'name,note\r\nAda,"a,b"');
  assert.equal(run('csv-formatter', 'one', 'csv-format-crlf').output, 'one');
  assert.ok(run('csv-formatter', 'a,b\n1', 'csv-format-crlf').warning);
  assert.deepEqual(JSON.parse(run('json-flatten', '{"user":{"name":"Ada"},"tags":["a"]}', 'json-pointer').output), {'/user/name':'Ada','/tags/0':'a'});
  assert.deepEqual(JSON.parse(run('json-flatten', 'null', 'json-pointer').output), {'/':null});
  assert.ok(run('json-flatten', '{bad}', 'json-pointer').warning);
  assert.equal(JSON.parse(run('paragraph-counter', 'One line.\n\nTwo words here.', 'paragraph-report').output).paragraphs, 2);
  assert.equal(JSON.parse(run('paragraph-counter', 'x', 'paragraph-report').output).paragraphs, 1);
  assert.ok(run('paragraph-counter', '', 'paragraph-report').warning);
  assert.equal(run('number-extractor', 'A -12, .5, 6.02e23 and id7x.', 'number-lines').output, '-12\n.5\n6.02e23');
  assert.equal(run('number-extractor', '0', 'number-lines').output, '0');
  assert.ok(run('number-extractor', 'no numbers', 'number-lines').warning);
  assert.equal(run('remove-punctuation', 'Hello, world! It’s 2026.', 'punctuation-spaces').output, 'Hello world It s 2026');
  assert.equal(run('remove-punctuation', 'plain', 'punctuation-spaces').output, 'plain');
  assert.ok(run('remove-punctuation', '', 'punctuation-spaces').warning);
  assert.equal(run('tsv-to-csv', 'name\tnote\nAda\ta,b', 'tsv-csv-crlf').output, 'name,note\r\nAda,"a,b"');
  assert.equal(run('tsv-to-csv', 'one', 'tsv-csv-crlf').output, 'one');
  assert.ok(run('tsv-to-csv', 'a\tb\n1', 'tsv-csv-crlf').warning);
  assert.equal(run('csv-to-tsv', 'name,note\nAda,"a,b"', 'csv-tsv-lf').output, 'name\tnote\nAda\ta,b');
  assert.equal(run('csv-to-tsv', 'one', 'csv-tsv-lf').output, 'one');
  assert.ok(run('csv-to-tsv', 'a,b\n"x\ny",z', 'csv-tsv-lf').warning);
});

test('2026-11-12 pages expose unique source SEO, crawl paths and eight locales', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const titles = new Set();
  const descriptions = new Set();
  for (const slug of slugs) {
    const html = fs.readFileSync(path.join(root, slug, 'index.html'), 'utf8');
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
    assert.ok(title && !titles.has(title), slug + ': unique title');
    assert.ok(description && !descriptions.has(description), slug + ': unique description');
    titles.add(title); descriptions.add(description);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, slug + ': one H1');
    assert.match(html, new RegExp('<link rel="canonical" href="https://asciitounicode\\.com/' + slug + '/">'));
    assert.match(html, /<meta name="robots" content="index, follow">/);
    assert.match(html, /"@type":"WebApplication"/);
    assert.match(html, /"@type":"Article"/);
    assert.match(html, /<h2\b/);
    assert.match(html, /<h3\b/);
    assert.match(html, /<table\b/);
    assert.match(html, /<pre><code>/);
    assert.match(html, /text-data-page-translations\.js/);
    assert.match(html, /validation-tools\.js/);
    assert.match(home, new RegExp('href="' + slug + '/"'));
    assert.match(sitemap, new RegExp('<loc>https://asciitounicode\\.com/' + slug + '/</loc><lastmod>2026-11-12</lastmod>'));
  }
  const context = vm.createContext({ window: { asciiUnicodeI18n: { pages: {}, meta: {}, home: { en:{},zh:{},es:{},pt:{},fr:{},de:{},ja:{},ko:{} } } } });
  vm.runInContext(fs.readFileSync(path.join(root, 'text-data-page-translations.js'), 'utf8'), context);
  assert.equal(Object.keys(context.window.asciiUnicodeI18n.pages).length, 15);
  for (const page of Object.values(context.window.asciiUnicodeI18n.pages)) {
    assert.deepEqual(Object.keys(page), ['en','zh','es','pt','fr','de','ja','ko']);
    for (const locale of Object.values(page)) assert.ok(locale.heroTitle && locale.heroLede && locale.warningValidation);
  }
});
