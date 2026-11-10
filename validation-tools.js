(function () {
  "use strict";

  const existing = window.asciiUnicodeUtilities || { converters: {}, warnings: {}, downloadExtensions: {} };
  const ok = (output, warning = "") => ({ output, warning });
  const bad = () => ok("", "warningValidation");
  const lines = input => String(input).replace(/\r\n?/g, "\n").split("\n");
  const hasUnpairedSurrogate = value => /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value);

  function secureIndex(limit) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 0x100000000) throw new Error("limit");
    const ceiling = Math.floor(0x100000000 / limit) * limit;
    const word = new Uint32Array(1);
    do { crypto.getRandomValues(word); } while (word[0] >= ceiling);
    return word[0] % limit;
  }

  function uuidGenerator(input, format) {
    const count = Number(String(input).trim());
    if (!Number.isInteger(count) || count < 1 || count > 1000 || format !== "uuid-v4") return bad();
    const output = [];
    for (let index = 0; index < count; index += 1) {
      if (typeof crypto.randomUUID === "function") output.push(crypto.randomUUID());
      else {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = bytes[6] & 0x0f | 0x40;
        bytes[8] = bytes[8] & 0x3f | 0x80;
        const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
        output.push(`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`);
      }
    }
    return ok(output.join("\n"));
  }

  function jsonValidator(input) {
    const probe = existing.converters["json-formatter"]?.(input, "json-indent-2");
    if (!probe || probe.warning) return bad();
    const value = JSON.parse(probe.output);
    const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
    return ok(JSON.stringify({ valid: true, type, characters: String(input).length }, null, 2));
  }

  function splitToolInput(input, marker) {
    const normalized = String(input).replace(/\r\n?/g, "\n");
    const token = `\n${marker}\n`;
    const index = normalized.indexOf(token);
    if (index < 0) throw new Error("marker");
    return [normalized.slice(0, index), normalized.slice(index + token.length)];
  }

  function regexTester(input, format) {
    let pattern, text;
    try { [pattern, text] = splitToolInput(input, "---TEXT---"); } catch { return bad(); }
    if (!pattern || pattern.length > 2000 || text.length > 200000) return bad();
    const flags = format === "regex-first" ? "u" : "gu";
    let regex;
    try { regex = new RegExp(pattern, flags); } catch { return bad(); }
    const matches = [];
    let match;
    while ((match = regex.exec(text)) && matches.length < 1000) {
      matches.push({ match: match[0], index: match.index, groups: match.slice(1) });
      if (!regex.global) break;
      if (match[0] === "") regex.lastIndex += 1;
    }
    return ok(JSON.stringify({ pattern, flags, count: matches.length, truncated: matches.length === 1000, matches }, null, 2));
  }

  function xmlValidator(input) {
    const probe = existing.converters["xml-formatter"]?.(input, "xml-indent-2");
    if (!probe || probe.warning) return bad();
    const root = probe.output.match(/^(?:<\?[\s\S]*?\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<([A-Za-z_][A-Za-z0-9._-]*)\b/)?.[1];
    if (!root) return bad();
    const elements = (probe.output.match(/<(?!\/|\?|!)[A-Za-z_][^>]*>/g) || []).length;
    return ok(JSON.stringify({ valid: true, root, elements }, null, 2));
  }

  function emailExtractor(input, format) {
    const matches = String(input).match(/[A-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+/gi) || [];
    const seen = new Set();
    const output = matches.filter(value => {
      const key = format === "extract-email-exact" ? value : value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    if (!output.length) return bad();
    return ok(output.join("\n"));
  }

  function urlExtractor(input) {
    const candidates = String(input).match(/https?:\/\/[^\s<>"']+/gi) || [];
    const seen = new Set();
    const output = [];
    for (const candidate of candidates) {
      const cleaned = candidate.replace(/[),.;!?\]}]+$/g, "");
      try {
        const url = new URL(cleaned);
        if (!['http:', 'https:'].includes(url.protocol) || seen.has(url.href)) continue;
        seen.add(url.href); output.push(url.href);
      } catch { /* ignore malformed candidate */ }
    }
    return output.length ? ok(output.join("\n")) : bad();
  }

  function removeLineBreaks(input, format) {
    if (!String(input).length || String(input).length > 200000) return bad();
    const source = lines(input);
    if (format === "join-lines-empty") return ok(source.join(""));
    if (format === "join-lines-space") return ok(source.map(line => line.trim()).filter(Boolean).join(" "));
    return bad();
  }

  function findAndReplace(input, format) {
    let find, tail, replacement, text;
    try {
      [find, tail] = splitToolInput(input, "---REPLACE---");
      [replacement, text] = splitToolInput(tail, "---TEXT---");
    } catch { return bad(); }
    if (!find || find.length > 2000 || text.length > 200000) return bad();
    if (format === "replace-literal-first") return ok(text.replace(find, replacement));
    if (format === "replace-literal-all") return ok(text.split(find).join(replacement));
    if (format === "replace-regex-all") {
      try { return ok(text.replace(new RegExp(find, "gu"), replacement)); } catch { return bad(); }
    }
    return bad();
  }

  const randomCharsets = {
    "random-alphanumeric": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    "random-lowercase": "abcdefghijklmnopqrstuvwxyz0123456789",
    "random-hex": "0123456789abcdef",
  };
  function randomString(input, format) {
    const length = Number(String(input).trim());
    const charset = randomCharsets[format];
    if (!charset || !Number.isInteger(length) || length < 1 || length > 4096) return bad();
    let output = "";
    for (let index = 0; index < length; index += 1) output += charset[secureIndex(charset.length)];
    return ok(output);
  }

  function passwordGenerator(input, format) {
    const length = Number(String(input).trim());
    const groups = format === "password-alphanumeric"
      ? ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz", "0123456789"]
      : ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz", "0123456789", "!@#$%^&*()-_=+"];
    if (!Number.isInteger(length) || length < 12 || length > 1024) return bad();
    const all = groups.join("");
    const output = groups.map(group => group[secureIndex(group.length)]);
    while (output.length < length) output.push(all[secureIndex(all.length)]);
    for (let index = output.length - 1; index > 0; index -= 1) {
      const target = secureIndex(index + 1);
      [output[index], output[target]] = [output[target], output[index]];
    }
    return ok(output.join(""));
  }

  function jsonEscape(input) {
    const source = String(input);
    if (source.length > 200000 || hasUnpairedSurrogate(source)) return bad();
    return ok(JSON.stringify(source));
  }

  function jsonUnescape(input) {
    try {
      const value = JSON.parse(String(input));
      return typeof value === "string" ? ok(value) : bad();
    } catch { return bad(); }
  }

  function randomInteger(minimum, maximum) {
    const span = BigInt(maximum) - BigInt(minimum) + 1n;
    const space = 1n << 64n;
    const limit = space - space % span;
    const bytes = new Uint8Array(8);
    let value;
    do {
      crypto.getRandomValues(bytes);
      value = 0n;
      for (const byte of bytes) value = value << 8n | BigInt(byte);
    } while (value >= limit);
    return Number(BigInt(minimum) + value % span);
  }
  function randomNumberGenerator(input, format) {
    if (format !== "random-integers") return bad();
    const parts = String(input).split(/[,\n]/).map(value => value.trim());
    if (parts.length !== 3 || !parts.every(value => /^-?\d+$/.test(value))) return bad();
    const [minimum, maximum, count] = parts.map(Number);
    if (![minimum, maximum, count].every(Number.isSafeInteger) || minimum > maximum || count < 1 || count > 1000) return bad();
    if (BigInt(maximum) - BigInt(minimum) + 1n > BigInt(Number.MAX_SAFE_INTEGER)) return bad();
    return ok(Array.from({ length: count }, () => randomInteger(minimum, maximum)).join("\n"));
  }

  function parseCsv(input) {
    const source = String(input).replace(/\r\n?/g, "\n");
    if (!source) throw new Error("empty");
    const rows = []; let row = []; let field = ""; let quoted = false; let afterQuote = false;
    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      if (quoted) {
        if (char === '"' && source[index + 1] === '"') { field += '"'; index += 1; }
        else if (char === '"') { quoted = false; afterQuote = true; }
        else field += char;
      } else if (afterQuote) {
        if (char === ',') { row.push(field); field = ""; afterQuote = false; }
        else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ""; afterQuote = false; }
        else throw new Error("after-quote");
      } else if (char === '"') {
        if (field) throw new Error("quote");
        quoted = true;
      } else if (char === ',') { row.push(field); field = ""; }
      else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else field += char;
    }
    if (quoted) throw new Error("unclosed");
    row.push(field); rows.push(row);
    if (rows.at(-1).length === 1 && rows.at(-1)[0] === "" && source.endsWith("\n")) rows.pop();
    const columns = rows[0]?.length || 0;
    if (!columns || rows.some(item => item.length !== columns)) throw new Error("columns");
    return { rows: rows.length, columns, emptyFields: rows.reduce((sum, item) => sum + item.filter(value => value === "").length, 0) };
  }
  function csvValidator(input) {
    try { return ok(JSON.stringify({ valid: true, ...parseCsv(input) }, null, 2)); } catch { return bad(); }
  }

  function xmlEscape(input, format) {
    const source = String(input);
    if (source.length > 200000 || hasUnpairedSurrogate(source) || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(source)) return bad();
    let output = source.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (format === "xml-attribute-escape") output = output.replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    else if (format !== "xml-text-escape") return bad();
    return ok(output);
  }

  Object.assign(existing.converters, {
    "uuid-generator": uuidGenerator,
    "json-validator": jsonValidator,
    "regex-tester": regexTester,
    "xml-validator": xmlValidator,
    "email-extractor": emailExtractor,
    "url-extractor": urlExtractor,
    "remove-line-breaks": removeLineBreaks,
    "find-and-replace-text": findAndReplace,
    "random-string-generator": randomString,
    "password-generator": passwordGenerator,
    "json-escape": jsonEscape,
    "json-unescape": jsonUnescape,
    "random-number-generator": randomNumberGenerator,
    "csv-validator": csvValidator,
    "xml-escape": xmlEscape,
  });
  Object.assign(existing.warnings, {
    warningValidation: "Check the documented input format and limits. Invalid, ambiguous or unsupported input is rejected without a partial result.",
  });
  Object.assign(existing.downloadExtensions, {
    "json-validator": "json",
    "regex-tester": "json",
    "xml-validator": "json",
    "csv-validator": "json",
  });
  window.asciiUnicodeUtilities = existing;
})();
