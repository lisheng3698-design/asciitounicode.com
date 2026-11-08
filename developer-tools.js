(function () {
  "use strict";

  const ok = (output, warning = "") => ({ output, warning });
  const bad = warning => ok("", warning);
  const loneSurrogate = /[\uD800-\uDFFF]/u;
  const wordPattern = /[\p{L}\p{N}]+(?:[\p{M}'’_-]*[\p{L}\p{N}]+)*/gu;

  function strictStandardBase64(input) {
    const value = input.trim();
    if (!value || !/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4) return null;
    try {
      const bytes = atob(value);
      return btoa(bytes) === value ? { value, bytes } : null;
    } catch {
      return null;
    }
  }

  function strictBase64Url(input) {
    const value = input.trim();
    if (!value || !/^[A-Za-z0-9_-]+={0,2}$/.test(value)) return null;
    const body = value.replace(/=+$/, "");
    if (body.length % 4 === 1 || value.includes("=") && value.length % 4) return null;
    const standard = body.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(body.length / 4) * 4, "=");
    try {
      const bytes = atob(standard);
      const canonical = btoa(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      return canonical === body ? { body, standard, bytes } : null;
    } catch {
      return null;
    }
  }

  function base64ToBase64Url(input, format) {
    const parsed = strictStandardBase64(input);
    if (!parsed) return bad("warningBase64Standard");
    const body = parsed.value.replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    return ok(format === "base64url-padded" ? body.padEnd(Math.ceil(body.length / 4) * 4, "=") : body);
  }

  function base64UrlToBase64(input, format) {
    const parsed = strictBase64Url(input);
    if (!parsed) return bad("warningBase64Url");
    return ok(format === "base64-standard-unpadded" ? parsed.standard.replace(/=+$/, "") : parsed.standard);
  }

  function countCharacters(input) {
    if (loneSurrogate.test(input)) return bad("warningUnicodeScalar");
    if (!input) return ok(JSON.stringify({
      graphemeClusters: 0,
      codePoints: 0,
      utf16Units: 0,
      utf8Bytes: 0,
      words: 0,
      lines: 0,
    }, null, 2));
    const graphemeClusters = Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(input)).length;
    const words = input.match(wordPattern)?.length || 0;
    return ok(JSON.stringify({
      graphemeClusters,
      codePoints: Array.from(input).length,
      utf16Units: input.length,
      utf8Bytes: new TextEncoder().encode(input).length,
      words,
      lines: input.split(/\r\n?|\n/).length,
    }, null, 2));
  }

  function caseWords(input) {
    return input.normalize("NFC").match(/[\p{L}\p{N}]+/gu) || [];
  }

  function convertCase(input, format) {
    if (format === "case-upper") return ok(input.toLocaleUpperCase("en"));
    if (format === "case-lower") return ok(input.toLocaleLowerCase("en"));
    if (format === "case-sentence") {
      const lower = input.toLocaleLowerCase("en");
      return ok(lower.replace(/(^|[.!?]\s+)(\p{L})/gu, (_, prefix, letter) => prefix + letter.toLocaleUpperCase("en")));
    }
    if (format === "case-title") {
      return ok(input.toLocaleLowerCase("en").replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_, prefix, letter) => prefix + letter.toLocaleUpperCase("en")));
    }
    const words = caseWords(input).map(word => word.toLocaleLowerCase("en"));
    if (!words.length) return bad("warningWords");
    if (format === "case-snake") return ok(words.join("_"));
    if (format === "case-kebab") return ok(words.join("-"));
    const joined = words.map(word => word[0].toLocaleUpperCase("en") + word.slice(1)).join("");
    return ok(format === "case-pascal" ? joined : joined[0].toLocaleLowerCase("en") + joined.slice(1));
  }

  const namedEncode = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const namedDecode = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };

  function htmlEncode(input, format) {
    if (loneSurrogate.test(input)) return bad("warningUnicodeScalar");
    if (format === "html-numeric") {
      return ok(Array.from(input, char => {
        const code = char.codePointAt(0);
        return code > 127 || Object.hasOwn(namedEncode, char) ? `&#${code};` : char;
      }).join(""));
    }
    return ok(input.replace(/[&<>"']/g, char => namedEncode[char]));
  }

  function htmlDecode(input) {
    let invalid = false;
    const output = input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body) => {
      if (body[0] !== "#") {
        const value = namedDecode[body.toLowerCase()];
        if (value === undefined) invalid = true;
        return value ?? entity;
      }
      const hex = body[1].toLowerCase() === "x";
      const value = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isInteger(value) || value === 0 || value > 0x10FFFF || value >= 0xD800 && value <= 0xDFFF) {
        invalid = true;
        return entity;
      }
      return String.fromCodePoint(value);
    });
    if (/&(?:#|[a-z])/i.test(output)) invalid = true;
    return invalid ? bad("warningHtmlEntity") : ok(output);
  }

  function inspectUnicode(input) {
    if (loneSurrogate.test(input)) return bad("warningUnicodeScalar");
    const encoder = new TextEncoder();
    return ok(Array.from(input, char => {
      const code = "U+" + char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
      const bytes = Array.from(encoder.encode(char), byte => byte.toString(16).toUpperCase().padStart(2, "0")).join(" ");
      return `${char}\t${code}\tUTF-8 ${bytes}`;
    }).join("\n"));
  }

  function utf8Encode(input, format) {
    if (loneSurrogate.test(input)) return bad("warningUnicodeScalar");
    const bytes = new TextEncoder().encode(input);
    if (format === "utf8-binary") return ok(Array.from(bytes, byte => byte.toString(2).padStart(8, "0")).join(" "));
    if (format === "utf8-decimal") return ok(Array.from(bytes).join(" "));
    return ok(Array.from(bytes, byte => byte.toString(16).toUpperCase().padStart(2, "0")).join(" "));
  }

  function parseBytes(input, format) {
    const value = input.trim();
    if (!value) return null;
    let parts;
    if (format === "bytes-hex") {
      const compact = value.replace(/^0x/i, "").replace(/[\s,;:_-]+/g, "");
      if (!/^(?:[0-9a-f]{2})+$/i.test(compact)) return null;
      parts = compact.match(/../g).map(item => Number.parseInt(item, 16));
    } else if (format === "bytes-binary") {
      const compact = value.replace(/[\s,;:_-]+/g, "");
      if (!/^(?:[01]{8})+$/.test(compact)) return null;
      parts = compact.match(/.{8}/g).map(item => Number.parseInt(item, 2));
    } else {
      parts = value.split(/[\s,;]+/).filter(Boolean).map(Number);
      if (!parts.length || parts.some(value => !Number.isInteger(value) || value < 0 || value > 255)) return null;
    }
    return Uint8Array.from(parts);
  }

  function utf8Decode(input, format) {
    const bytes = parseBytes(input, format);
    if (!bytes) return bad("warningUtf8Bytes");
    try {
      return ok(new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes));
    } catch {
      return bad("warningUtf8Bytes");
    }
  }

  function words(input) {
    return input.normalize("NFC").match(wordPattern) || [];
  }

  function removeDuplicateWords(input, format) {
    const tokens = words(input);
    if (!tokens.length) return bad("warningWords");
    const seen = new Set();
    return ok(tokens.filter(token => {
      const key = format === "words-fold" ? token.toLocaleLowerCase("en") : token;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).join(" "));
  }

  function sortWords(input, format) {
    const tokens = words(input);
    if (!tokens.length) return bad("warningWords");
    const collator = new Intl.Collator("en", { numeric: format === "words-natural", sensitivity: "base" });
    const indexed = tokens.map((token, index) => ({ token, index }));
    indexed.sort((a, b) => {
      const comparison = format === "words-length" ? a.token.length - b.token.length : collator.compare(a.token, b.token);
      return comparison || a.index - b.index;
    });
    return ok(indexed.map(item => item.token).join(" "));
  }

  function countLines(input) {
    if (!input) return ok(JSON.stringify({ totalLines: 0, nonEmptyLines: 0, blankLines: 0, longestLineCharacters: 0 }, null, 2));
    const lines = input.replace(/\r\n?/g, "\n").split("\n");
    const nonEmptyLines = lines.filter(line => line.length > 0).length;
    const longestLineCharacters = lines.reduce((max, line) => Math.max(max, Array.from(line).length), 0);
    return ok(JSON.stringify({
      totalLines: lines.length,
      nonEmptyLines,
      blankLines: lines.length - nonEmptyLines,
      longestLineCharacters,
    }, null, 2));
  }

  function decodeQueryPart(value) {
    if (/%(?![0-9a-f]{2})/i.test(value)) throw new URIError("bad escape");
    return decodeURIComponent(value.replace(/\+/g, " "));
  }

  function parseQueryString(input) {
    try {
      const value = input.trim().replace(/^[^?]*\?/, "").replace(/^\?/, "").split("#", 1)[0];
      const output = Object.create(null);
      if (!value) return ok("{}");
      for (const pair of value.split("&")) {
        const separator = pair.indexOf("=");
        const key = decodeQueryPart(separator < 0 ? pair : pair.slice(0, separator));
        const item = decodeQueryPart(separator < 0 ? "" : pair.slice(separator + 1));
        if (Object.hasOwn(output, key)) output[key] = Array.isArray(output[key]) ? [...output[key], item] : [output[key], item];
        else output[key] = item;
      }
      return ok(JSON.stringify(output, null, 2));
    } catch {
      return bad("warningQueryString");
    }
  }

  function buildQueryString(input) {
    let value;
    try { value = JSON.parse(input); } catch { return bad("warningQueryJson"); }
    if (!value || Array.isArray(value) || typeof value !== "object") return bad("warningQueryJson");
    const params = new URLSearchParams();
    for (const [key, raw] of Object.entries(value)) {
      const items = Array.isArray(raw) ? raw : [raw];
      if (!items.length || items.some(item => typeof item !== "string" && typeof item !== "number")) return bad("warningQueryJson");
      for (const item of items) params.append(key, String(item));
    }
    return ok(params.toString());
  }

  function maskJsonStrings(input) {
    let output = "", inString = false, escaped = false;
    for (const char of input) {
      if (inString) {
        output += " ";
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
      } else {
        output += char === '"' ? " " : char;
        if (char === '"') inString = true;
      }
    }
    return output;
  }

  function jsonMinify(input) {
    const masked = maskJsonStrings(input);
    for (const match of masked.matchAll(/-?\d+/g)) {
      if (match[0].replace("-", "").length >= 16) {
        try {
          const value = BigInt(match[0]);
          if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) return bad("warningJsonUnsafe");
        } catch {
          return bad("warningJsonSyntax");
        }
      }
    }
    try {
      return ok(JSON.stringify(JSON.parse(input)));
    } catch {
      return bad("warningJsonSyntax");
    }
  }

  const existing = window.asciiUnicodeUtilities || { converters: {}, warnings: {}, downloadExtensions: {} };
  Object.assign(existing.converters, {
    "base64-to-base64url": base64ToBase64Url,
    "base64url-to-base64": base64UrlToBase64,
    "unicode-character-counter": countCharacters,
    "case-converter": convertCase,
    "html-encoder": htmlEncode,
    "html-decoder": htmlDecode,
    "unicode-character-inspector": inspectUnicode,
    "utf8-encoder": utf8Encode,
    "utf8-decoder": utf8Decode,
    "remove-duplicate-words": removeDuplicateWords,
    "sort-words": sortWords,
    "line-counter": countLines,
    "query-string-parser": parseQueryString,
    "query-string-builder": buildQueryString,
    "json-minifier": jsonMinify,
  });
  Object.assign(existing.warnings, {
    warningBase64Standard: "Use canonical standard Base64 with the + and / alphabet and correct = padding.",
    warningBase64Url: "Use canonical Base64URL with the - and _ alphabet. Padding may be present or omitted.",
    warningUnicodeScalar: "The input contains an unpaired UTF-16 surrogate and is not valid Unicode scalar text.",
    warningHtmlEntity: "Use complete supported named or numeric HTML entities ending with a semicolon.",
    warningUtf8Bytes: "Use complete bytes in the selected format and a valid, shortest-form UTF-8 sequence.",
    warningWords: "No Unicode word tokens were found.",
    warningQueryString: "The query string contains an invalid percent escape.",
    warningQueryJson: "Use a JSON object whose values are strings, numbers, or arrays of strings or numbers.",
    warningJsonUnsafe: "A JSON integer exceeds JavaScript's exact integer range. Quote it as a string to preserve every digit.",
    warningJsonSyntax: "Enter strict JSON without comments, trailing commas, NaN or missing values.",
  });
  Object.assign(existing.downloadExtensions, {
    "query-string-parser": "json",
    "json-minifier": "json",
  });
  window.asciiUnicodeUtilities = existing;
})();
