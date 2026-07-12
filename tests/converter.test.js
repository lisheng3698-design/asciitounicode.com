const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadTools() {
  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const sandbox = {
    TextDecoder,
    Blob,
    URL,
    Date,
    Array,
    Number,
    String,
    RegExp,
    document: {
      addEventListener() {},
      querySelectorAll() {
        return [];
      }
    },
    window: {
      dataLayer: undefined,
      asciiUnicodeEvents: undefined
    }
  };
  sandbox.window.window = sandbox.window;
  sandbox.window.document = sandbox.document;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "app.js" });
  return sandbox.window.asciiUnicodeTools;
}

const tools = loadTools();

test("decode mode converts Unicode escape sequences", () => {
  assert.equal(tools.convertValue("\\u0048\\u0069", "decode", "js-short").output, "Hi");
  assert.equal(tools.convertValue("\\u4F60\\u597D", "decode", "js-short").output, "你好");
  assert.equal(tools.convertValue("\\uD83D\\uDE00", "decode", "js-short").output, "😀");
  assert.equal(tools.convertValue("\\u{1F600}", "decode", "js-short").output, "😀");
});

test("decode mode converts entities, U+ notation, percent escapes, and UTF-8 bytes", () => {
  assert.equal(tools.convertValue("&#x2603;", "decode", "js-short").output, "☃");
  assert.equal(tools.convertValue("&#9731;", "decode", "js-short").output, "☃");
  assert.equal(tools.convertValue("U+1F680", "decode", "js-short").output, "🚀");
  assert.equal(tools.convertValue("%u4F60%u597D", "decode", "js-short").output, "你好");
  assert.equal(tools.convertValue("\\xE2\\x98\\x80", "decode", "js-short").output, "☀");
});

test("encode mode supports all output formats", () => {
  assert.equal(tools.convertValue("A☃😀", "encode", "js-short").output, "\\u0041\\u2603\\uD83D\\uDE00");
  assert.equal(tools.convertValue("A☃😀", "encode", "js-brace").output, "\\u{41}\\u{2603}\\u{1F600}");
  assert.equal(tools.convertValue("A☃😀", "encode", "html-dec").output, "&#65;&#9731;&#128512;");
  assert.equal(tools.convertValue("A☃😀", "encode", "html-hex").output, "&#x41;&#x2603;&#x1F600;");
  assert.equal(tools.convertValue("A☃😀", "encode", "uplus").output, "U+0041 U+2603 U+1F600");
});

test("unicode to ascii mode preserves ASCII and escapes only unsupported characters", () => {
  const options = { preserveAscii: true };
  assert.equal(tools.convertValue("Hello, 世界! 😀", "encode", "js-short", options).output, "Hello, \\u4E16\\u754C! \\uD83D\\uDE00");
  assert.equal(tools.convertValue("café", "encode", "html-hex", options).output, "caf&#xE9;");
});

test("unicode to ascii modes transliterate, replace, or remove unsupported characters", () => {
  assert.equal(tools.convertValue("café déjà vu — Straße", "transliterate", "js-short").output, "cafe deja vu - Strasse");
  assert.equal(tools.convertValue("你好 😀", "transliterate", "js-short").output, "?? ?");
  assert.equal(tools.convertValue("café 你好", "ascii-replace", "js-short").output, "caf? ??");
  assert.equal(tools.convertValue("café 你好", "ascii-remove", "js-short").output, "caf ");
});

test("HTML entity mode decodes entities and encodes plain text", () => {
  assert.equal(tools.convertValue("&#x2603;", "entities", "html-hex").output, "☃");
  assert.equal(tools.convertValue("☃", "entities", "html-hex").output, "&#x2603;");
  assert.equal(tools.convertValue("☃", "entities", "html-dec").output, "&#9731;");
});

test("mojibake mode repairs common UTF-8-as-Latin-1 text", () => {
  assert.equal(tools.convertValue("cafÃ©", "mojibake", "js-short").output, "café");
  assert.equal(tools.convertValue("It was â\\x98\\x80", "mojibake", "js-short").output, "It was ☀");
});

test("imported TXT content is converted the same as pasted content", () => {
  const importedText = fs.readFileSync(path.join(__dirname, "fixtures", "import-sample.txt"), "utf8");
  assert.equal(importedText, "\\u4F60\\u597D\n");
  assert.equal(tools.convertValue(importedText, "decode", "js-short").output, "你好\n");
});

test("warnings are returned for empty, unchanged, and malformed input", () => {
  assert.equal(tools.convertValue("", "decode", "js-short").warning, "warningEmpty");
  assert.equal(tools.convertValue("plain text", "decode", "js-short").warning, "warningNoChange");
  assert.equal(tools.convertValue("\\u12", "decode", "js-short").warning, "warningMalformed");
});
