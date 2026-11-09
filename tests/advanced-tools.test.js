const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const context = vm.createContext({
  window: {},
  TextEncoder,
  TextDecoder,
  URL,
  Intl,
  atob,
  btoa,
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../advanced-tools.js'), 'utf8'), context);
const converters = context.window.asciiUnicodeUtilities.converters;
const run = (slug, input, format) => converters[slug](input, format);

test('JSON formatter preserves valid data and rejects unsafe or invalid literals', () => {
  assert.equal(run('json-formatter', '{"a":[1,true],"text":"x"}', 'json-indent-2').output, '{\n  "a": [\n    1,\n    true\n  ],\n  "text": "x"\n}');
  assert.equal(run('json-formatter', '{"a":1}', 'json-indent-4').output.split('\n')[1], '    "a": 1');
  for (const input of ['{"a":}', '{"a":9007199254740993}', 'NaN']) assert.ok(run('json-formatter', input, 'json-indent-2').warning);
});

test('URL parser exposes components, repeated query keys and international hostnames', () => {
  const parsed = JSON.parse(run('url-parser', 'https://user:pass@münich.example:8443/a%20b?q=1&q=2#top', 'url-json').output);
  assert.equal(parsed.protocol, 'https:');
  assert.equal(parsed.hostname, 'xn--mnich-kva.example');
  assert.equal(parsed.pathname, '/a%20b');
  assert.deepEqual(parsed.query.q, ['1', '2']);
  assert.ok(run('url-parser', '/relative', 'url-json').warning);
  assert.ok(run('url-parser', 'javascript:alert(1)', 'url-json').warning);
});

test('Punycode converter round trips Unicode domain labels and rejects malformed labels', () => {
  assert.equal(run('punycode-converter', 'münich.example', 'punycode-encode').output, 'xn--mnich-kva.example');
  assert.equal(run('punycode-converter', 'xn--mnich-kva.example', 'punycode-decode').output, 'münich.example');
  assert.equal(run('punycode-converter', '例え.テスト', 'punycode-encode').output, 'xn--r8jz45g.xn--zckzah');
  for (const input of ['bad label.example', 'xn--$', '']) assert.ok(run('punycode-converter', input, 'punycode-decode').warning);
});

test('XML formatter validates nesting and keeps comments, CDATA and text visible', () => {
  assert.equal(run('xml-formatter', '<root><item id="1">A</item><item><![CDATA[B<C]]></item></root>', 'xml-indent-2').output,
    '<root>\n  <item id="1">A</item>\n  <item>\n    <![CDATA[B<C]]>\n  </item>\n</root>');
  assert.ok(run('xml-formatter', '<a><b></a>', 'xml-indent-2').warning);
  assert.ok(run('xml-formatter', '<!DOCTYPE a><a/>', 'xml-indent-2').warning);
});

test('JSON and XML converters use documented attribute, text and array conventions', () => {
  const xml = run('json-to-xml', '{"person":{"name":"Ada","skills":["math","code"]}}', 'xml-indent-2').output;
  assert.match(xml, /^<root>/);
  assert.match(xml, /<person>/);
  assert.match(xml, /<skills>math<\/skills>/);
  assert.match(xml, /<skills>code<\/skills>/);
  const json = JSON.parse(run('xml-to-json', '<person id="7"><name>Ada</name><skill>math</skill><skill>code</skill></person>', 'json-indent-2').output);
  assert.deepEqual(json, { person: { '@id': '7', name: 'Ada', skill: ['math', 'code'] } });
  assert.ok(run('json-to-xml', '{"bad key":1}', 'xml-indent-2').warning);
  assert.ok(run('xml-to-json', '<a><b></a>', 'json-indent-2').warning);
});

test('Text compare returns deterministic line operations from a visible separator', () => {
  const result = JSON.parse(run('text-compare', 'alpha\nbeta\n---COMPARE---\nalpha\ngamma', 'compare-json').output);
  assert.equal(result.equal, false);
  assert.deepEqual(result.operations.map(item => item.type), ['equal', 'removed', 'added']);
  assert.ok(run('text-compare', 'only one side', 'compare-json').warning);
});

test('JWT decoder decodes header and payload without claiming signature verification', () => {
  const token = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWRhIn0.';
  const decoded = JSON.parse(run('jwt-decoder', token, 'jwt-combined').output);
  assert.equal(decoded.header.alg, 'none');
  assert.equal(decoded.payload.name, 'Ada');
  assert.equal(decoded.signatureVerified, false);
  for (const input of ['a.b', '***.e30.x', 'eyJ4IjoxfQ.e30.x']) assert.ok(run('jwt-decoder', input, 'jwt-combined').warning);
});

test('Hash generator produces canonical SHA-256 for UTF-8 text', () => {
  assert.equal(run('hash-generator', 'abc', 'sha256-lower').output, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(run('hash-generator', 'abc', 'sha256-upper').output, 'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD');
  assert.ok(run('hash-generator', '\ud800', 'sha256-lower').warning);
});

test('Unix timestamp converter distinguishes seconds, milliseconds and ISO input', () => {
  assert.equal(run('unix-timestamp-converter', '0', 'timestamp-seconds-to-iso').output, '1970-01-01T00:00:00.000Z');
  assert.equal(run('unix-timestamp-converter', '1000', 'timestamp-milliseconds-to-iso').output, '1970-01-01T00:00:01.000Z');
  assert.equal(run('unix-timestamp-converter', '1970-01-01T00:00:01.000Z', 'timestamp-iso-to-seconds').output, '1');
  for (const input of ['1.5', '999999999999999999999']) assert.ok(run('unix-timestamp-converter', input, 'timestamp-seconds-to-iso').warning);
  assert.ok(run('unix-timestamp-converter', '2026-01-01', 'timestamp-iso-to-seconds').warning);
});

test('Line and word tools cover Unicode, blanks, numbering, reversal and duplicates', () => {
  assert.deepEqual(JSON.parse(run('word-frequency-counter', 'Café café tea 茶 茶', 'frequency-fold').output), [
    { word: 'café', count: 2 }, { word: '茶', count: 2 }, { word: 'tea', count: 1 },
  ]);
  assert.equal(run('remove-empty-lines', 'a\n \n\tb\n\n', 'empty-whitespace').output, 'a\n\tb');
  assert.equal(run('remove-empty-lines', 'a\n \nb', 'empty-strict').output, 'a\n \nb');
  assert.equal(run('add-line-numbers', 'a\nb', 'numbers-plain').output, '1\ta\n2\tb');
  assert.equal(run('add-line-numbers', 'a\nb', 'numbers-padded').output, '0001\ta\n0002\tb');
  assert.equal(run('reverse-lines', 'a\nb\nc\n', 'reverse-keep-final').output, 'c\nb\na\n');
  assert.equal(run('reverse-lines', 'a\nb\nc\n', 'reverse-no-final').output, 'c\nb\na');
  assert.deepEqual(JSON.parse(run('duplicate-line-finder', 'A\nb\na\nA\n', 'duplicates-fold').output), [
    { line: 'A', count: 3, lineNumbers: [1, 3, 4] },
  ]);
  assert.equal(run('duplicate-line-finder', 'a\nb', 'duplicates-exact').output, '[]');
});
