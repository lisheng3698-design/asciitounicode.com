(function () {
  "use strict";
  const ok = (output, warning = "") => ({ output, warning });
  const bad = warning => ok("", warning);
  const alphabet32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const alphabet58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const loneSurrogate = /[\uD800-\uDFFF]/u;

  function inputBytes(input, format) {
    if (format === "input-hex") {
      const hex = input.trim().replace(/^0x/i, "").replace(/\s+/g, "");
      if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) return null;
      return Uint8Array.from(hex.match(/../g), p => parseInt(p, 16));
    }
    return loneSurrogate.test(input) ? null : new TextEncoder().encode(input);
  }
  function showBytes(bytes, format) {
    if (format === "output-hex") return ok(Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("").toUpperCase());
    try {
      return ok(new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes));
    } catch {
      return bad("warningCodecUtf8");
    }
  }
  function base32Encode(input, format) {
    const bytes = inputBytes(input, format);
    if (!bytes) return bad("warningCodecInput");
    let acc = 0, bits = 0, out = "";
    for (const byte of bytes) {
      acc = (acc << 8) | byte; bits += 8;
      while (bits >= 5) { bits -= 5; out += alphabet32[(acc >>> bits) & 31]; }
      acc &= (1 << bits) - 1;
    }
    if (bits) out += alphabet32[(acc << (5 - bits)) & 31];
    return ok(out.padEnd(Math.ceil(out.length / 8) * 8, "="));
  }
  function base32Decode(input, format) {
    const value = input.replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z2-7]+={0,6}$/.test(value)) return bad("warningBase32");
    const body = value.replace(/=+$/, "");
    const expected = { 0: 0, 2: 6, 4: 4, 5: 3, 7: 1 }[body.length % 8];
    if (expected === undefined || value.includes("=") && (value.length % 8 || value.length - body.length !== expected)) return bad("warningBase32");
    let acc = 0, bits = 0; const bytes = [];
    for (const ch of body) {
      acc = (acc << 5) | alphabet32.indexOf(ch); bits += 5;
      if (bits >= 8) { bits -= 8; bytes.push((acc >>> bits) & 255); }
      acc &= (1 << bits) - 1;
    }
    return acc ? bad("warningBase32") : showBytes(Uint8Array.from(bytes), format);
  }
  function base58Encode(input, format) {
    const bytes = inputBytes(input, format);
    if (!bytes) return bad("warningCodecInput");
    if (bytes.length > 4096) return bad("warningBase58Limit");
    let zeros = 0, n = 0n, out = "";
    while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
    for (const b of bytes) n = n * 256n + BigInt(b);
    while (n) { out = alphabet58[Number(n % 58n)] + out; n /= 58n; }
    return ok("1".repeat(zeros) + out);
  }
  function base58Decode(input, format) {
    const value = input.trim();
    if (!value || value.length > 5600) return bad("warningBase58Limit");
    let n = 0n, zeros = 0;
    while (value[zeros] === "1") zeros++;
    for (const ch of value) {
      const digit = alphabet58.indexOf(ch);
      if (digit < 0) return bad("warningBase58");
      n = n * 58n + BigInt(digit);
    }
    let hex = n === 0n ? "" : n.toString(16);
    if (hex.length % 2) hex = "0" + hex;
    if (zeros + hex.length / 2 > 4096) return bad("warningBase58Limit");
    const bytes = new Uint8Array(zeros + hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) bytes[zeros + i / 2] = parseInt(hex.slice(i, i + 2), 16);
    return showBytes(bytes, format);
  }
  function urlEncode(input, format) {
    if (loneSurrogate.test(input)) return bad("warningCodecInput");
    let output = encodeURIComponent(input);
    if (format === "url-rfc3986") output = output.replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
    if (format === "url-form") output = new URLSearchParams([["value", input]]).toString().slice(6);
    return ok(output);
  }
  function normalizeUnicode(input, format = "NFC") {
    if (loneSurrogate.test(input) || !["NFC", "NFD", "NFKC", "NFKD"].includes(format)) return bad("warningCodecInput");
    const output = input.normalize(format);
    return ok(output, format.startsWith("NFK") && output !== input ? "warningCompatibility" : "");
  }
  function slugify(input, format) {
    const normalized = input.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
    const loss = format === "slug-ascii" && /[^\x00-\x7f]/.test(normalized);
    const output = (format === "slug-ascii"
      ? normalized.replace(/[^a-z0-9]+/g, "-")
      : normalized.replace(/[^\p{L}\p{N}]+/gu, "-")).replace(/^-+|-+$/g, "");
    return ok(output, loss ? "warningSlugLoss" : "");
  }
  const delimiter = format => format === "csv-tab" ? "\t" : format === "csv-semicolon" ? ";" : ",";
  function jsonToCsv(input, format) {
    let rows;
    try {
      rows = JSON.parse(input, (key, value) => {
        if (typeof value === "number" && (!Number.isFinite(value) || Number.isInteger(value) && !Number.isSafeInteger(value))) throw new RangeError("number");
        return value;
      });
    } catch (error) { return bad(error instanceof RangeError ? "warningJsonNumber" : "warningJsonSyntax"); }
    if (!Array.isArray(rows) || !rows.length || rows.some(r => !r || typeof r !== "object" || Array.isArray(r))) return bad("warningJsonRows");
    const headers = [...new Set(rows.flatMap(Object.keys))];
    if (!headers.length) return bad("warningJsonRows");
    let unsafe = false, formula = headers.some(h => /^[=+\-@]/.test(h));
    const cell = value => {
      if (typeof value === "number" && (!Number.isFinite(value) || Number.isInteger(value) && !Number.isSafeInteger(value))) unsafe = true;
      if (typeof value === "string" && /^[=+\-@]/.test(value)) formula = true;
      const s = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const d = delimiter(format);
    const lines = [headers.map(cell).join(d), ...rows.map(row => headers.map(h => cell(Object.hasOwn(row, h) ? row[h] : undefined)).join(d))];
    return unsafe ? bad("warningJsonNumber") : ok(lines.join("\r\n"), formula ? "warningCsvFormula" : "");
  }
  function parseCsv(input, d) {
    const text = input.replace(/^\uFEFF/, "");
    const rows = []; let row = [], field = "", quoted = false, closed = false;
    const finish = () => { row.push(field); field = ""; closed = false; };
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else { quoted = false; closed = true; }
        } else field += ch;
      } else if (ch === d) finish();
      else if (ch === "\r" || ch === "\n") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        finish(); rows.push(row); row = [];
      } else if (closed) return null;
      else if (ch === '"') {
        if (field) return null;
        quoted = true;
      } else field += ch;
    }
    if (quoted) return null;
    if (field || row.length || closed) { finish(); rows.push(row); }
    return rows;
  }
  function csvToJson(input, format) {
    const rows = parseCsv(input, delimiter(format));
    if (!rows || !rows.length) return bad("warningCsvSyntax");
    const headers = rows.shift();
    if (headers.some(h => !h.trim()) || new Set(headers).size !== headers.length) return bad("warningCsvHeader");
    if (rows.some(row => row.length !== headers.length)) return bad("warningCsvSyntax");
    return ok(JSON.stringify(rows.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i]]))), null, 2));
  }
  function rot13(input) {
    return ok(input.replace(/[a-zA-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() <= "m" ? 13 : -13))));
  }
  const morseKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?/-";
  const morseValues = ".- -... -.-. -.. . ..-. --. .... .. .--- -.- .-.. -- -. --- .--. --.- .-. ... - ..- ...- .-- -..- -.-- --.. ----- .---- ..--- ...-- ....- ..... -.... --... ---.. ----. .-.-.- --..-- ..--.. -..-. -....-".split(" ");
  const morse = Object.fromEntries([...morseKeys].map((k, i) => [k, morseValues[i]]));
  const fromMorse = Object.fromEntries(Object.entries(morse).map(([k, v]) => [v, k]));
  function translateMorse(input, format) {
    if (format === "morse-decode") {
      const words = input.trim().split(/\s*\/\s*/);
      if (words.some(w => !w)) return bad("warningMorse");
      const out = [];
      for (const word of words) {
        const chars = word.trim().split(/\s+/);
        if (chars.some(c => !Object.hasOwn(fromMorse, c))) return bad("warningMorse");
        out.push(chars.map(c => fromMorse[c]).join(""));
      }
      return ok(out.join(" "));
    }
    const words = input.trim().toUpperCase().split(/\s+/), out = [];
    for (const word of words) {
      const chars = [...word];
      if (chars.some(c => !Object.hasOwn(morse, c))) return bad("warningMorse");
      out.push(chars.map(c => morse[c]).join(" "));
    }
    return ok(out.join(" / "));
  }
  function reverseText(input, format) {
    if (format === "reverse-lines") return ok(input.split(/\r\n?|\n/).reverse().join("\n"));
    if (format === "reverse-words") {
      const words = input.match(/\S+/g) || [];
      return ok(input.replace(/\S+/g, () => words.pop()));
    }
    return ok(Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(input), s => s.segment).reverse().join(""));
  }
  function removeWhitespace(input, format) {
    if (format === "whitespace-trim") return ok(input.split("\n").map(s => s.trim()).join("\n"));
    if (format === "whitespace-collapse") return ok(input.replace(/[^\S\r\n]+/g, " "));
    return ok(input.replace(/\s+/g, ""));
  }
  function splitLines(input) {
    const final = /\r?\n$/.test(input);
    const lines = input.replace(/\r\n?/g, "\n").split("\n");
    if (final) lines.pop();
    return { lines, final };
  }
  function sortLines(input, format) {
    const { lines, final } = splitLines(input);
    const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
    lines.sort(format === "sort-natural" ? natural.compare : (a, b) => (a < b ? -1 : a > b ? 1 : 0) * (format === "sort-desc" ? -1 : 1));
    return ok(lines.join("\n") + (final ? "\n" : ""));
  }
  function uniqueLines(input, format) {
    const { lines, final } = splitLines(input), seen = new Set(), output = [];
    for (const line of lines) {
      const key = format === "unique-trim" ? line.trim() : format === "unique-fold" ? line.toLowerCase() : line;
      if (!seen.has(key)) { seen.add(key); output.push(line); }
    }
    return ok(output.join("\n") + (final ? "\n" : ""));
  }
  window.asciiUnicodeUtilities = {
    converters: {
      "url-encoder": urlEncode, "base32-encoder": base32Encode, "base32-decoder": base32Decode,
      "base58-encoder": base58Encode, "base58-decoder": base58Decode, "unicode-normalizer": normalizeUnicode,
      "slug-generator": slugify, "json-to-csv": jsonToCsv, "csv-to-json": csvToJson,
      rot13, "morse-code-translator": translateMorse, "text-reverser": reverseText,
      "whitespace-remover": removeWhitespace, "line-sorter": sortLines, "duplicate-line-remover": uniqueLines
    },
    warnings: {
      warningCodecInput: "Use valid Unicode text or complete hexadecimal byte pairs, according to the selected input type.",
      warningBase32: "Use RFC 4648 Base32 (A-Z and 2-7), with valid padding and zero trailing bits. Base32hex and Crockford Base32 are unsupported.",
      warningBase58: "Use the Bitcoin Base58 alphabet. The characters 0, O, I and l and internal spaces are invalid.",
      warningBase58Limit: "Base58 input is limited to 4 KiB of decoded bytes.",
      warningCodecUtf8: "The decoded bytes are not valid UTF-8. Select hexadecimal output to inspect the original bytes.",
      warningCompatibility: "Compatibility normalization can discard distinctions such as fullwidth forms and circled numbers.",
      warningSlugLoss: "ASCII mode removed non-ASCII letters. Choose the Unicode mode to retain those letters.",
      warningJsonSyntax: "Enter valid JSON. Comments and trailing commas are unsupported.",
      warningJsonRows: "Enter a nonempty JSON array of objects with at least one field.",
      warningJsonNumber: "A number exceeds JavaScript's exact range or is not finite. Encode large numbers as JSON strings before converting.",
      warningCsvSyntax: "Check CSV quotes, delimiters and column counts. Embedded quotes must be doubled.",
      warningCsvHeader: "The header must contain nonempty, unique column names.",
      warningCsvFormula: "Some text cells begin with spreadsheet formula characters. The CSV preserves these strings; review them before opening in a spreadsheet.",
      warningMorse: "Use A-Z, 0-9 and . , ? / - when encoding, or space-separated Morse symbols with / between words when decoding."
    },
    downloadExtensions: { "json-to-csv": "csv", "csv-to-json": "json" }
  };
})();
