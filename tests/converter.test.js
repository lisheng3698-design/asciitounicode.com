const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadTools() {
  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const sandbox = {
    TextDecoder,
    TextEncoder,
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

test("ascii to binary mode emits fixed 8-bit groups and flags non-ASCII input", () => {
  assert.equal(tools.convertValue("A B", "ascii-binary", "binary-space").output, "01000001 00100000 01000010");
  assert.equal(tools.convertValue("Hi", "ascii-binary", "binary-compact").output, "0100100001101001");
  assert.equal(tools.convertValue("AB", "ascii-binary", "binary-lines").output, "01000001\n01000010");
  assert.equal(tools.convertValue("café", "ascii-binary", "binary-space").warning, "warningNonAscii");
  assert.equal(tools.convertValue("café", "ascii-binary", "binary-space").output, "01100011 01100001 01100110 ????????");
});

test("utf8 binary mode encodes non-ASCII text as UTF-8 bytes", () => {
  assert.equal(tools.convertValue("é", "utf8-binary", "binary-space").output, "11000011 10101001");
  assert.equal(tools.convertValue("你", "utf8-binary", "binary-space").output, "11100100 10111101 10100000");
  assert.equal(tools.convertValue("😀", "utf8-binary", "binary-compact").output, "11110000100111111001100010000000");
});

test("ascii to hex mode supports common output formats and flags non-ASCII input", () => {
  assert.equal(tools.convertValue("Hello", "ascii-hex", "hex-space").output, "48 65 6C 6C 6F");
  assert.equal(tools.convertValue("Hi", "ascii-hex", "hex-compact").output, "4869");
  assert.equal(tools.convertValue("Hi", "ascii-hex", "hex-prefix").output, "0x48 0x69");
  assert.equal(tools.convertValue("Hi", "ascii-hex", "hex-escape").output, "\\x48\\x69");

  const nonAscii = tools.convertValue("café", "ascii-hex", "hex-space");
  assert.equal(nonAscii.output, "63 61 66 ??");
  assert.equal(nonAscii.warning, "warningNonAsciiHexEncode");
});

test("utf8 hex mode encodes multilingual text as UTF-8 bytes", () => {
  assert.equal(tools.convertValue("é", "utf8-hex", "hex-space").output, "C3 A9");
  assert.equal(tools.convertValue("你", "utf8-hex", "hex-space").output, "E4 BD A0");
  assert.equal(tools.convertValue("😀", "utf8-hex", "hex-compact").output, "F09F9880");
});

test("ascii to decimal mode emits separated base-10 values", () => {
  assert.equal(tools.convertValue("Hello", "ascii-decimal", "decimal-space").output, "72 101 108 108 111");
  assert.equal(tools.convertValue("A B", "ascii-decimal", "decimal-comma").output, "65, 32, 66");
  assert.equal(tools.convertValue("A\tB", "ascii-decimal", "decimal-lines").output, "65\n9\n66");
});

test("ascii to decimal mode flags unsupported characters", () => {
  const result = tools.convertValue("café", "ascii-decimal", "decimal-space");
  assert.equal(result.output, "99 97 102 ?");
  assert.equal(result.warning, "warningNonAsciiDecimal");
  assert.equal(tools.convertValue("", "ascii-decimal", "decimal-space").warning, "warningEmpty");
});

test("utf8 decimal mode emits unambiguous encoded bytes", () => {
  assert.equal(tools.convertValue("é", "utf8-decimal", "decimal-space").output, "195 169");
  assert.equal(tools.convertValue("你", "utf8-decimal", "decimal-space").output, "228 189 160");
  assert.equal(tools.convertValue("😀", "utf8-decimal", "decimal-comma").output, "240, 159, 152, 128");
});

test("decimal to ASCII and UTF-8 modes validate ranges and malformed input", () => {
  assert.equal(tools.convertValue("72 101 108 108 111", "decimal-to-text", "decimal-ascii").output, "Hello");
  assert.equal(tools.convertValue("195, 169", "decimal-to-text", "decimal-utf8").output, "é");
  assert.equal(tools.convertValue("128", "decimal-to-text", "decimal-ascii").warning, "warningDecimalRange");
  assert.equal(tools.convertValue("72 nope", "decimal-to-text", "decimal-ascii").warning, "warningInvalidDecimal");
  assert.equal(tools.convertValue("255", "decimal-to-text", "decimal-utf8").warning, "warningInvalidUtf8Decimal");
});

test("ASCII to octal supports strict ASCII and UTF-8 byte output", () => {
  assert.equal(tools.convertValue("Hello", "ascii-octal", "octal-space").output, "110 145 154 154 157");
  assert.equal(tools.convertValue("A B", "ascii-octal", "octal-prefix").output, "0o101 0o040 0o102");
  assert.equal(tools.convertValue("é", "utf8-octal", "octal-space").output, "303 251");
  assert.equal(tools.convertValue("é", "ascii-octal", "octal-space").warning, "warningNonAsciiOctal");
});

test("octal to ASCII parses separated and compact input with strict validation", () => {
  assert.equal(tools.convertValue("110 145 154 154 157", "octal-to-text", "octal-ascii").output, "Hello");
  assert.equal(tools.convertValue("110145154154157", "octal-to-text", "octal-ascii").output, "Hello");
  assert.equal(tools.convertValue("0o110, 0o151", "octal-to-text", "octal-ascii").output, "Hi");
  assert.equal(tools.convertValue("303 251", "octal-to-text", "octal-utf8").output, "é");
  assert.equal(tools.convertValue("178", "octal-to-text", "octal-ascii").warning, "warningInvalidOctal");
  assert.equal(tools.convertValue("200", "octal-to-text", "octal-ascii").warning, "warningOctalRange");
});

test("Unicode code point hex and binary stay distinct from UTF-8 bytes", () => {
  assert.equal(tools.convertValue("Aé你😀", "unicode-codepoint-hex", "codepoint-uplus").output, "U+0041 U+00E9 U+4F60 U+1F600");
  assert.equal(tools.convertValue("😀", "utf8-hex", "codepoint-uplus").output, "F0 9F 98 80");
  assert.equal(tools.convertValue("é", "utf8-hex", "codepoint-0x").output, "0xC3 0xA9");
  assert.equal(tools.convertValue("é", "utf8-hex", "codepoint-hex-lines").output, "C3\nA9");
  assert.equal(tools.convertValue("é", "unicode-codepoint-binary", "codepoint-binary-space").output, "11101001");
  assert.equal(tools.convertValue("é", "utf8-binary", "codepoint-binary-space").output, "11000011 10101001");
  assert.equal(tools.convertValue("é", "utf8-binary", "codepoint-binary-lines").output, "11000011\n10101001");
  assert.equal(tools.convertValue("😀", "unicode-codepoint-binary", "codepoint-binary-space").output, "000011111011000000000");
});

test("hex to Unicode decodes scalar values separately from UTF-8 bytes", () => {
  assert.equal(tools.convertValue("U+4F60 U+597D", "hex-to-unicode", "unicode-hex-codepoints").output, "你好");
  assert.equal(tools.convertValue("1F600", "hex-to-unicode", "unicode-hex-codepoints").output, "😀");
  assert.equal(tools.convertValue("E4 BD A0", "hex-to-unicode", "unicode-hex-utf8").output, "你");
  assert.equal(tools.convertValue("110000", "hex-to-unicode", "unicode-hex-codepoints").warning, "warningUnicodeRange");
  assert.equal(tools.convertValue("D800", "hex-to-unicode", "unicode-hex-codepoints").warning, "warningUnicodeSurrogate");
});

test("decimal to Unicode supports code points and UTF-8 decimal bytes", () => {
  assert.equal(tools.convertValue("20320 22909", "decimal-to-unicode", "unicode-decimal-codepoints").output, "你好");
  assert.equal(tools.convertValue("128512", "decimal-to-unicode", "unicode-decimal-codepoints").output, "😀");
  assert.equal(tools.convertValue("228 189 160", "decimal-to-unicode", "unicode-decimal-utf8").output, "你");
  assert.equal(tools.convertValue("1114112", "decimal-to-unicode", "unicode-decimal-codepoints").warning, "warningUnicodeRange");
  assert.equal(tools.convertValue("55296", "decimal-to-unicode", "unicode-decimal-codepoints").warning, "warningUnicodeSurrogate");
});

test("Unicode to decimal distinguishes scalar values from UTF-8 bytes", () => {
  assert.equal(tools.convertValue("Aé你😀", "unicode-codepoint-decimal", "unicode-decimal-space").output, "65 233 20320 128512");
  assert.equal(tools.convertValue("é", "unicode-codepoint-decimal", "unicode-decimal-comma").output, "233");
  assert.equal(tools.convertValue("é", "unicode-utf8-decimal", "unicode-decimal-space").output, "195 169");
});

test("character to Unicode exposes U+, decimal, and UTF-8 hex representations", () => {
  assert.equal(tools.convertValue("A你😀", "character-to-unicode", "character-uplus").output, "U+0041 U+4F60 U+1F600");
  assert.equal(tools.convertValue("A你😀", "character-to-unicode", "character-decimal").output, "65 20320 128512");
  assert.equal(tools.convertValue("é", "character-to-unicode", "character-utf8-hex").output, "C3 A9");
});

test("hex to binary preserves every nibble and rejects invalid input", () => {
  assert.equal(tools.convertValue("2F A0", "hex-to-binary", "hex-binary-nibbles").output, "0010 1111 1010 0000");
  assert.equal(tools.convertValue("0x02FA", "hex-to-binary", "hex-binary-compact").output, "0000001011111010");
  assert.equal(tools.convertValue("00 FF", "hex-to-binary", "hex-binary-bytes").output, "00000000 11111111");
  assert.equal(tools.convertValue("2G", "hex-to-binary", "hex-binary-nibbles").warning, "warningInvalidHex");
});

test("binary to hex preserves nibble width and rejects invalid input", () => {
  assert.equal(tools.convertValue("1111 0000", "binary-to-hex", "binary-hex-upper").output, "F0");
  assert.equal(tools.convertValue("0b00001111", "binary-to-hex", "binary-hex-prefix").output, "0x0F");
  assert.equal(tools.convertValue("101", "binary-to-hex", "binary-hex-lower").output, "5");
  assert.equal(tools.convertValue("10201", "binary-to-hex", "binary-hex-upper").warning, "warningInvalidBinary");
});

test("hex to decimal handles prefixes, large integers, and malformed input", () => {
  assert.equal(tools.convertValue("0xFF", "hex-to-decimal", "base-decimal").output, "255");
  assert.equal(tools.convertValue("FFFFFFFFFFFFFFFF", "hex-to-decimal", "base-decimal").output, "18446744073709551615");
  assert.equal(tools.convertValue("1A_2B", "hex-to-decimal", "base-decimal").output, "6699");
  assert.equal(tools.convertValue("-FF", "hex-to-decimal", "base-decimal").warning, "warningInvalidHexInteger");
});

test("octal to decimal validates base-8 digits and keeps large integers exact", () => {
  assert.equal(tools.convertValue("0o755", "octal-to-decimal", "base-decimal").output, "493");
  assert.equal(tools.convertValue("1777777777777777777777", "octal-to-decimal", "base-decimal").output, "18446744073709551615");
  assert.equal(tools.convertValue("7_55", "octal-to-decimal", "base-decimal").output, "493");
  assert.equal(tools.convertValue("789", "octal-to-decimal", "base-decimal").warning, "warningInvalidOctalInteger");
});

test("octal to hex supports output casing and prefix", () => {
  assert.equal(tools.convertValue("755", "octal-to-hex", "octal-hex-upper").output, "1ED");
  assert.equal(tools.convertValue("0o377", "octal-to-hex", "octal-hex-prefix").output, "0xFF");
  assert.equal(tools.convertValue("17", "octal-to-hex", "octal-hex-lower").output, "f");
  assert.equal(tools.convertValue("128", "octal-to-hex", "octal-hex-upper").warning, "warningInvalidOctalInteger");
});

test("hex to octal converts exact integers and rejects unsupported signs", () => {
  assert.equal(tools.convertValue("0x1ED", "hex-to-octal", "hex-octal-plain").output, "755");
  assert.equal(tools.convertValue("FF", "hex-to-octal", "hex-octal-prefix").output, "0o377");
  assert.equal(tools.convertValue("FFFFFFFFFFFFFFFF", "hex-to-octal", "hex-octal-plain").output, "1777777777777777777777");
  assert.equal(tools.convertValue("+FF", "hex-to-octal", "hex-octal-plain").warning, "warningInvalidHexInteger");
});

test("hex to text mode parses common byte formats and decodes UTF-8", () => {
  assert.equal(tools.convertValue("48 65 6C 6C 6F", "hex-to-text", "hex-utf8").output, "Hello");
  assert.equal(tools.convertValue("48656c6c6f", "hex-to-text", "hex-utf8").output, "Hello");
  assert.equal(tools.convertValue("0x48, 0x69", "hex-to-text", "hex-utf8").output, "Hi");
  assert.equal(tools.convertValue("\\x48\\x69", "hex-to-text", "hex-utf8").output, "Hi");
  assert.equal(tools.convertValue("E4 BD A0 E5 A5 BD", "hex-to-text", "hex-utf8").output, "你好");
});

test("hex to text mode reports unsupported and malformed bytes", () => {
  const ascii = tools.convertValue("48 FF 21", "hex-to-text", "hex-ascii");
  assert.equal(ascii.output, "H?!");
  assert.equal(ascii.warning, "warningNonAsciiHex");
  assert.equal(tools.convertValue("4G", "hex-to-text", "hex-utf8").warning, "warningInvalidHex");
  assert.equal(tools.convertValue("486", "hex-to-text", "hex-utf8").warning, "warningOddHex");
  assert.equal(tools.convertValue("C3 28", "hex-to-text", "hex-utf8").warning, "warningInvalidUtf8");
});

test("binary to text mode decodes separated and compact ASCII groups", () => {
  assert.equal(tools.convertValue("01001000 01101001", "binary-to-text", "binary-ascii").output, "Hi");
  assert.equal(tools.convertValue("0100000101000010", "binary-to-text", "binary-ascii").output, "AB");
  assert.equal(tools.convertValue("1000001, 1000010", "binary-to-text", "binary-ascii").output, "AB");
  assert.equal(tools.convertValue("0b01001000:0b01101001", "binary-to-text", "binary-ascii").output, "Hi");
});

test("binary to text mode decodes UTF-8 bytes and reports invalid input", () => {
  assert.equal(
    tools.convertValue("11100100 10111101 10100000 11100101 10100101 10111101", "binary-to-text", "binary-utf8").output,
    "你好"
  );
  assert.equal(tools.convertValue("10000000", "binary-to-text", "binary-ascii").warning, "warningNonAsciiBinary");
  assert.equal(tools.convertValue("0100000", "binary-to-text", "binary-utf8").warning, "warningIncompleteBinary");
  assert.equal(tools.convertValue("0100000x", "binary-to-text", "binary-ascii").warning, "warningInvalidBinary");
  assert.equal(tools.convertValue("11111111", "binary-to-text", "binary-utf8").warning, "warningInvalidUtf8Binary");
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
