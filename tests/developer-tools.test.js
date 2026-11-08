const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const context = vm.createContext({
  window: {},
  TextEncoder,
  TextDecoder,
  URLSearchParams,
  URL,
  Intl,
  atob,
  btoa,
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../developer-tools.js'), 'utf8'), context);
const converters = context.window.asciiUnicodeUtilities.converters;
const run = (slug, input, format) => converters[slug](input, format);

test('Base64 and Base64URL converters validate alphabets, padding and zero bytes', () => {
  assert.equal(run('base64-to-base64url', '++//AA==', 'base64url-unpadded').output, '--__AA');
  assert.equal(run('base64-to-base64url', 'Zg==', 'base64url-padded').output, 'Zg==');
  assert.equal(run('base64url-to-base64', '--__AA', 'base64-standard-padded').output, '++//AA==');
  assert.equal(run('base64url-to-base64', 'Zg', 'base64-standard-unpadded').output, 'Zg');
  for (const input of ['A', 'Zg=', 'Z===', 'a b', '++__']) {
    assert.ok(run('base64-to-base64url', input, 'base64url-unpadded').warning);
  }
  for (const input of ['A', 'Zg=', 'Z===', '+/']) {
    assert.ok(run('base64url-to-base64', input, 'base64-standard-padded').warning);
  }
});

test('Unicode character counter distinguishes graphemes, code points, UTF-16 and UTF-8', () => {
  const counts = JSON.parse(run('unicode-character-counter', 'A👩‍💻é\n', 'count-summary').output);
  assert.deepEqual(counts, {
    graphemeClusters: 4,
    codePoints: 7,
    utf16Units: 9,
    utf8Bytes: 16,
    words: 2,
    lines: 2,
  });
  assert.equal(JSON.parse(run('unicode-character-counter', '', 'count-summary').output).lines, 0);
  assert.ok(run('unicode-character-counter', '\ud800', 'count-summary').warning);
});

test('Case converter covers prose and identifier cases without claiming locale-neutral title rules', () => {
  assert.equal(run('case-converter', 'hello WORLD', 'case-upper').output, 'HELLO WORLD');
  assert.equal(run('case-converter', 'hello WORLD', 'case-lower').output, 'hello world');
  assert.equal(run('case-converter', 'hello WORLD. NEXT line', 'case-sentence').output, 'Hello world. Next line');
  assert.equal(run('case-converter', 'hello-world example', 'case-title').output, 'Hello-World Example');
  assert.equal(run('case-converter', 'Hello world XML', 'case-camel').output, 'helloWorldXml');
  assert.equal(run('case-converter', 'Hello world XML', 'case-pascal').output, 'HelloWorldXml');
  assert.equal(run('case-converter', 'Hello world XML', 'case-snake').output, 'hello_world_xml');
  assert.equal(run('case-converter', 'Hello world XML', 'case-kebab').output, 'hello-world-xml');
  assert.ok(run('case-converter', '---', 'case-camel').warning);
});

test('HTML encoder and decoder handle named and numeric entities without executing markup', () => {
  assert.equal(run('html-encoder', '<a title="x">Tom & Jerry\'s</a>', 'html-named').output, '&lt;a title=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;');
  assert.equal(run('html-encoder', 'Aé', 'html-numeric').output, 'A&#233;');
  assert.equal(run('html-decoder', '&lt;b&gt;Tom &amp; Jerry&lt;/b&gt;', 'html-decode').output, '<b>Tom & Jerry</b>');
  assert.equal(run('html-decoder', '&#x1F680; &#9731;', 'html-decode').output, '🚀 ☃');
  for (const input of ['&unknown;', '&#x110000;', '&#0;', '&amp']) assert.ok(run('html-decoder', input, 'html-decode').warning);
});

test('Unicode inspector exposes exact scalar and byte evidence', () => {
  const out = run('unicode-character-inspector', 'A🚀é', 'inspect-codepoints').output;
  assert.match(out, /A\tU\+0041\tUTF-8 41/);
  assert.match(out, /🚀\tU\+1F680\tUTF-8 F0 9F 9A 80/);
  assert.match(out, /e\tU\+0065\tUTF-8 65/);
  assert.match(out, /́\tU\+0301\tUTF-8 CC 81/);
  assert.ok(run('unicode-character-inspector', '\ud800', 'inspect-codepoints').warning);
});

test('UTF-8 encoder and decoder round trip multilingual bytes and reject malformed input', () => {
  assert.equal(run('utf8-encoder', 'Aé🚀', 'utf8-hex').output, '41 C3 A9 F0 9F 9A 80');
  assert.equal(run('utf8-encoder', 'A', 'utf8-binary').output, '01000001');
  assert.equal(run('utf8-encoder', 'Aé', 'utf8-decimal').output, '65 195 169');
  assert.equal(run('utf8-decoder', '41 C3 A9 F0 9F 9A 80', 'bytes-hex').output, 'Aé🚀');
  assert.equal(run('utf8-decoder', '01000001 11000011 10101001', 'bytes-binary').output, 'Aé');
  assert.equal(run('utf8-decoder', '65, 195, 169', 'bytes-decimal').output, 'Aé');
  for (const [input, format] of [['C0 AF', 'bytes-hex'], ['11000011', 'bytes-binary'], ['65 256', 'bytes-decimal'], ['ABC', 'bytes-hex']]) {
    assert.ok(run('utf8-decoder', input, format).warning);
  }
  assert.ok(run('utf8-encoder', '\ud800', 'utf8-hex').warning);
});

test('Word tools use Unicode tokens and make separator loss explicit', () => {
  assert.equal(run('remove-duplicate-words', 'One two one TWO café café', 'words-exact').output, 'One two one TWO café');
  assert.equal(run('remove-duplicate-words', 'One two one TWO café café', 'words-fold').output, 'One two café');
  assert.equal(run('sort-words', 'file10 file2 file1', 'words-natural').output, 'file1 file2 file10');
  assert.equal(run('sort-words', 'pear apple fig', 'words-length').output, 'fig pear apple');
  assert.equal(run('sort-words', 'éclair Apple banana', 'words-alpha').output, 'Apple banana éclair');
  assert.ok(run('sort-words', '... ---', 'words-alpha').warning);
});

test('Line counter handles empty input, final newline and blank records', () => {
  assert.deepEqual(JSON.parse(run('line-counter', 'a\n\nbb\n', 'line-summary').output), {
    totalLines: 4,
    nonEmptyLines: 2,
    blankLines: 2,
    longestLineCharacters: 2,
  });
  assert.deepEqual(JSON.parse(run('line-counter', '', 'line-summary').output), {
    totalLines: 0,
    nonEmptyLines: 0,
    blankLines: 0,
    longestLineCharacters: 0,
  });
});

test('Query string parser and builder preserve repeated keys and encode values', () => {
  assert.deepEqual(JSON.parse(run('query-string-parser', '?a=1&a=2&space=hello+world&empty=', 'query-to-json').output), {
    a: ['1', '2'],
    space: 'hello world',
    empty: '',
  });
  assert.equal(run('query-string-builder', '{"a":["1","2"],"space":"hello world","empty":""}', 'json-to-query').output, 'a=1&a=2&space=hello+world&empty=');
  assert.ok(run('query-string-parser', 'a=%E0%A4%A', 'query-to-json').warning);
  for (const input of ['[]', '{"a":{"b":1}}', '{"a":null}', '{"a":true}']) assert.ok(run('query-string-builder', input, 'json-to-query').warning);
});

test('JSON minifier validates structure and unsafe integer literals', () => {
  assert.equal(run('json-minifier', '{\n  "a": [1, true, null],\n  "text": "a b"\n}', 'json-minify').output, '{"a":[1,true,null],"text":"a b"}');
  assert.equal(run('json-minifier', '"text"', 'json-minify').output, '"text"');
  for (const input of ['{"a":}', '{"a":9007199254740993}', 'NaN']) assert.ok(run('json-minifier', input, 'json-minify').warning);
});
