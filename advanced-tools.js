(function () {
  "use strict";

  const ok = (output, warning = "") => ({ output, warning });
  const bad = warning => ok("", warning);
  const loneSurrogate = /[\uD800-\uDFFF]/u;
  const xmlName = /^[A-Za-z_][A-Za-z0-9._-]*$/;

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

  function parseSafeJson(input) {
    const masked = maskJsonStrings(input);
    for (const match of masked.matchAll(/-?\d+/g)) {
      if (match[0].replace("-", "").length >= 16) {
        try {
          const value = BigInt(match[0]);
          if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) return null;
        } catch { return null; }
      }
    }
    try { return JSON.parse(input); } catch { return null; }
  }

  function jsonFormatter(input, format) {
    const value = parseSafeJson(input);
    if (value === null && input.trim() !== "null") return bad("warningJsonFormat");
    return ok(JSON.stringify(value, null, format === "json-indent-4" ? 4 : 2));
  }

  function urlParser(input) {
    let url;
    try { url = new URL(input.trim()); } catch { return bad("warningUrlAbsolute"); }
    if (!['http:', 'https:'].includes(url.protocol)) return bad("warningUrlAbsolute");
    const query = Object.create(null);
    for (const [key, value] of url.searchParams) {
      if (Object.hasOwn(query, key)) query[key] = Array.isArray(query[key]) ? [...query[key], value] : [query[key], value];
      else query[key] = value;
    }
    return ok(JSON.stringify({
      href: url.href,
      protocol: url.protocol,
      username: url.username,
      password: url.password,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      query,
      hash: url.hash,
      origin: url.origin,
    }, null, 2));
  }

  const punyBase = 36, punyTMin = 1, punyTMax = 26, punySkew = 38, punyDamp = 700, punyInitialBias = 72, punyInitialN = 128;
  const digitToBasic = digit => String.fromCharCode(digit + 22 + 75 * (digit < 26));
  const basicToDigit = code => code >= 48 && code <= 57 ? code - 22 : code >= 65 && code <= 90 ? code - 65 : code >= 97 && code <= 122 ? code - 97 : punyBase;
  function adapt(delta, points, first) {
    delta = first ? Math.floor(delta / punyDamp) : delta >> 1;
    delta += Math.floor(delta / points);
    let k = 0;
    while (delta > Math.floor((punyBase - punyTMin) * punyTMax / 2)) {
      delta = Math.floor(delta / (punyBase - punyTMin));
      k += punyBase;
    }
    return k + Math.floor((punyBase - punyTMin + 1) * delta / (delta + punySkew));
  }
  function punyEncodeLabel(label) {
    const input = Array.from(label, char => char.codePointAt(0));
    let output = input.filter(code => code < 128).map(code => String.fromCharCode(code)).join("");
    let handled = output.length, basic = handled, n = punyInitialN, delta = 0, bias = punyInitialBias;
    if (basic) output += "-";
    while (handled < input.length) {
      let m = Infinity;
      for (const code of input) if (code >= n && code < m) m = code;
      if (!Number.isFinite(m) || m - n > Math.floor((Number.MAX_SAFE_INTEGER - delta) / (handled + 1))) throw new Error("overflow");
      delta += (m - n) * (handled + 1); n = m;
      for (const code of input) {
        if (code < n && ++delta > Number.MAX_SAFE_INTEGER) throw new Error("overflow");
        if (code !== n) continue;
        let q = delta;
        for (let k = punyBase; ; k += punyBase) {
          const t = k <= bias ? punyTMin : k >= bias + punyTMax ? punyTMax : k - bias;
          if (q < t) break;
          output += digitToBasic(t + (q - t) % (punyBase - t));
          q = Math.floor((q - t) / (punyBase - t));
        }
        output += digitToBasic(q);
        bias = adapt(delta, handled + 1, handled === basic);
        delta = 0; handled++;
      }
      delta++; n++;
    }
    return output;
  }
  function punyDecodeLabel(input) {
    const output = [];
    const delimiter = input.lastIndexOf("-");
    let index = 0;
    if (delimiter >= 0) {
      for (let j = 0; j < delimiter; j++) {
        const code = input.charCodeAt(j);
        if (code >= 128) throw new Error("non-basic");
        output.push(code);
      }
      index = delimiter + 1;
    }
    let n = punyInitialN, i = 0, bias = punyInitialBias;
    while (index < input.length) {
      const oldI = i;
      let weight = 1;
      for (let k = punyBase; ; k += punyBase) {
        if (index >= input.length) throw new Error("truncated");
        const digit = basicToDigit(input.charCodeAt(index++));
        if (digit >= punyBase || digit > Math.floor((Number.MAX_SAFE_INTEGER - i) / weight)) throw new Error("digit");
        i += digit * weight;
        const t = k <= bias ? punyTMin : k >= bias + punyTMax ? punyTMax : k - bias;
        if (digit < t) break;
        if (weight > Math.floor(Number.MAX_SAFE_INTEGER / (punyBase - t))) throw new Error("overflow");
        weight *= punyBase - t;
      }
      const length = output.length + 1;
      bias = adapt(i - oldI, length, oldI === 0);
      n += Math.floor(i / length); i %= length;
      if (n > 0x10FFFF || n >= 0xD800 && n <= 0xDFFF) throw new Error("range");
      output.splice(i++, 0, n);
    }
    return String.fromCodePoint(...output);
  }
  function punycodeConverter(input, format) {
    const value = input.trim().replace(/[。．｡]/g, ".");
    if (!value || value.length > 253 || value.split(".").some(label => !label || label.length > 63 || /\s/.test(label))) return bad("warningPunycodeDomain");
    try {
      const labels = value.split(".").map(label => {
        if (format === "punycode-decode") {
          if (!/^xn--/i.test(label)) {
            if (!/^[\x00-\x7F]+$/.test(label) || !/^[A-Za-z0-9-]+$/.test(label)) throw new Error("label");
            return label;
          }
          const body = label.slice(4);
          if (!body || !/^[A-Za-z0-9-]+$/.test(body)) throw new Error("label");
          return punyDecodeLabel(body.toLowerCase());
        }
        if (!/^[\x00-\x7F]+$/.test(label)) return "xn--" + punyEncodeLabel(label);
        if (!/^[A-Za-z0-9-]+$/.test(label) || label.startsWith("-") || label.endsWith("-")) throw new Error("label");
        return label.toLowerCase();
      });
      const output = labels.join(".");
      if (output.split(".").some(label => label.length > 63)) throw new Error("length");
      return ok(output);
    } catch { return bad("warningPunycodeDomain"); }
  }

  function decodeXmlEntities(value) {
    let invalid = false;
    const result = value.replace(/&(#x[0-9A-Fa-f]+|#\d+|amp|lt|gt|quot|apos);/g, (full, body) => {
      const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
      if (named[body]) return named[body];
      const number = Number.parseInt(body.slice(body[1].toLowerCase() === "x" ? 2 : 1), body[1].toLowerCase() === "x" ? 16 : 10);
      if (!Number.isInteger(number) || number <= 0 || number > 0x10FFFF || number >= 0xD800 && number <= 0xDFFF) { invalid = true; return full; }
      return String.fromCodePoint(number);
    });
    if (/&(?!#\d+;|#x[0-9A-Fa-f]+;|amp;|lt;|gt;|quot;|apos;)/.test(result)) invalid = true;
    if (invalid) throw new Error("entity");
    return result;
  }
  const encodeXml = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  function parseAttributes(source) {
    const attrs = Object.create(null);
    let index = 0;
    while (index < source.length) {
      const space = source.slice(index).match(/^\s+/);
      if (space) index += space[0].length;
      if (index >= source.length) break;
      const match = source.slice(index).match(/^([A-Za-z_][A-Za-z0-9._-]*)\s*=\s*("([^"]*)"|'([^']*)')/);
      if (!match || Object.hasOwn(attrs, match[1])) throw new Error("attribute");
      attrs[match[1]] = decodeXmlEntities(match[3] ?? match[4]);
      index += match[0].length;
    }
    return attrs;
  }
  function parseXml(input) {
    if (!input.trim() || /<!DOCTYPE/i.test(input)) throw new Error("doctype");
    const tokens = input.match(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/[A-Za-z_][^>]*>|<[A-Za-z_][^>]*>|[^<]+/g) || [];
    if (tokens.join("") !== input) throw new Error("token");
    const document = { type: "document", children: [] };
    const stack = [document];
    for (const token of tokens) {
      if (token.startsWith("<!--")) {
        if (token.slice(4, -3).includes("--")) throw new Error("comment");
        stack.at(-1).children.push({ type: "comment", value: token.slice(4, -3) });
      } else if (token.startsWith("<![CDATA[")) {
        stack.at(-1).children.push({ type: "cdata", value: token.slice(9, -3) });
      } else if (token.startsWith("<?")) {
        stack.at(-1).children.push({ type: "pi", value: token.slice(2, -2).trim() });
      } else if (token.startsWith("</")) {
        const match = token.match(/^<\/([A-Za-z_][A-Za-z0-9._-]*)\s*>$/);
        if (!match || stack.length === 1 || stack.at(-1).name !== match[1]) throw new Error("close");
        stack.pop();
      } else if (token.startsWith("<")) {
        const selfClosing = /\/\s*>$/.test(token);
        const body = token.slice(1, selfClosing ? token.search(/\/\s*>$/) : -1).trim();
        const match = body.match(/^([A-Za-z_][A-Za-z0-9._-]*)([\s\S]*)$/);
        if (!match) throw new Error("open");
        const node = { type: "element", name: match[1], attrs: parseAttributes(match[2]), children: [] };
        stack.at(-1).children.push(node);
        if (!selfClosing) stack.push(node);
      } else if (token.trim() || stack.length > 1) {
        stack.at(-1).children.push({ type: "text", value: decodeXmlEntities(token) });
      }
    }
    if (stack.length !== 1) throw new Error("unclosed");
    const roots = document.children.filter(node => node.type === "element");
    if (roots.length !== 1 || document.children.some(node => node.type === "text" && node.value.trim())) throw new Error("root");
    return document;
  }
  function formatXmlNode(node, depth, indent) {
    const pad = indent.repeat(depth);
    if (node.type === "text") return pad + encodeXml(node.value);
    if (node.type === "comment") return pad + `<!--${node.value}-->`;
    if (node.type === "cdata") return pad + `<![CDATA[${node.value}]]>`;
    if (node.type === "pi") return pad + `<?${node.value}?>`;
    const attrs = Object.entries(node.attrs).map(([key, value]) => ` ${key}="${encodeXml(value)}"`).join("");
    if (!node.children.length) return `${pad}<${node.name}${attrs}/>`;
    if (node.children.length === 1 && node.children[0].type === "text" && !node.children[0].value.includes("\n")) {
      return `${pad}<${node.name}${attrs}>${encodeXml(node.children[0].value)}</${node.name}>`;
    }
    const children = node.children.filter(child => child.type !== "text" || child.value.trim());
    return `${pad}<${node.name}${attrs}>\n${children.map(child => formatXmlNode(child, depth + 1, indent)).join("\n")}\n${pad}</${node.name}>`;
  }
  function xmlFormatter(input, format) {
    try {
      const document = parseXml(input);
      const indent = format === "xml-indent-4" ? "    " : "  ";
      return ok(document.children.filter(node => node.type !== "text" || node.value.trim()).map(node => formatXmlNode(node, 0, indent)).join("\n"));
    } catch { return bad("warningXmlSyntax"); }
  }

  function jsonValueToXml(name, value, depth, indent) {
    if (!xmlName.test(name)) throw new Error("key");
    const pad = indent.repeat(depth);
    if (Array.isArray(value)) return value.map(item => jsonValueToXml(name, item, depth, indent)).join("\n");
    if (value !== null && typeof value === "object") {
      const entries = Object.entries(value);
      if (!entries.length) return `${pad}<${name}/>`;
      return `${pad}<${name}>\n${entries.map(([key, item]) => jsonValueToXml(key, item, depth + 1, indent)).join("\n")}\n${pad}</${name}>`;
    }
    const text = value === null ? "" : String(value);
    return `${pad}<${name}>${encodeXml(text)}</${name}>`;
  }
  function jsonToXml(input, format) {
    const value = parseSafeJson(input);
    if (value === null && input.trim() !== "null" || value === null || typeof value !== "object" || Array.isArray(value)) return bad("warningJsonXml");
    try {
      const indent = format === "xml-indent-4" ? "    " : "  ";
      return ok(jsonValueToXml("root", value, 0, indent));
    } catch { return bad("warningJsonXml"); }
  }
  function xmlNodeToJson(node) {
    const output = Object.create(null);
    for (const [key, value] of Object.entries(node.attrs)) output[`@${key}`] = value;
    const text = node.children.filter(child => child.type === "text" || child.type === "cdata").map(child => child.value).join("").trim();
    const elements = node.children.filter(child => child.type === "element");
    if (!elements.length) return Object.keys(output).length ? (text && (output['#text'] = text), output) : text;
    if (text) output['#text'] = text;
    for (const child of elements) {
      const value = xmlNodeToJson(child);
      if (Object.hasOwn(output, child.name)) output[child.name] = Array.isArray(output[child.name]) ? [...output[child.name], value] : [output[child.name], value];
      else output[child.name] = value;
    }
    return output;
  }
  function xmlToJson(input, format) {
    try {
      const document = parseXml(input);
      const root = document.children.find(node => node.type === "element");
      return ok(JSON.stringify({ [root.name]: xmlNodeToJson(root) }, null, format === "json-indent-4" ? 4 : 2));
    } catch { return bad("warningXmlSyntax"); }
  }

  function textCompare(input) {
    const separator = /^---COMPARE---\s*$/m;
    const match = separator.exec(input);
    if (!match) return bad("warningCompareSeparator");
    const left = input.slice(0, match.index).replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
    const right = input.slice(match.index + match[0].length).replace(/^\r?\n/, "").replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
    const rows = left.length + 1, cols = right.length + 1;
    const lcs = Array.from({ length: rows }, () => new Uint32Array(cols));
    for (let i = left.length - 1; i >= 0; i--) for (let j = right.length - 1; j >= 0; j--) lcs[i][j] = left[i] === right[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    const operations = []; let i = 0, j = 0;
    while (i < left.length || j < right.length) {
      if (i < left.length && j < right.length && left[i] === right[j]) operations.push({ type: "equal", leftLine: ++i, rightLine: ++j, text: left[i - 1] });
      else if (j < right.length && (i === left.length || lcs[i][j + 1] > lcs[i + 1][j])) operations.push({ type: "added", rightLine: j + 1, text: right[j++] });
      else operations.push({ type: "removed", leftLine: i + 1, text: left[i++] });
    }
    return ok(JSON.stringify({ equal: operations.every(item => item.type === "equal"), operations }, null, 2));
  }

  function decodeBase64UrlJson(value) {
    if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) throw new Error("base64url");
    const standard = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(standard), char => char.charCodeAt(0));
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const parsed = JSON.parse(text);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("json");
    return parsed;
  }
  function jwtDecoder(input, format) {
    const parts = input.trim().split(".");
    if (parts.length !== 3 || !parts[0] || !parts[1] || !/^[A-Za-z0-9_-]*$/.test(parts[2])) return bad("warningJwt");
    try {
      const header = decodeBase64UrlJson(parts[0]);
      const payload = decodeBase64UrlJson(parts[1]);
      if (format === "jwt-header") return ok(JSON.stringify(header, null, 2), "warningJwtUnverified");
      if (format === "jwt-payload") return ok(JSON.stringify(payload, null, 2), "warningJwtUnverified");
      return ok(JSON.stringify({ header, payload, signatureVerified: false }, null, 2), "warningJwtUnverified");
    } catch { return bad("warningJwt"); }
  }

  function rotateRight(value, bits) { return value >>> bits | value << 32 - bits; }
  function sha256(input, format) {
    if (loneSurrogate.test(input)) return bad("warningUnicodeScalar");
    const bytes = Array.from(new TextEncoder().encode(input));
    const bitLength = BigInt(bytes.length) * 8n;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let shift = 56n; shift >= 0n; shift -= 8n) bytes.push(Number(bitLength >> shift & 255n));
    const constants = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const hash = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    for (let offset = 0; offset < bytes.length; offset += 64) {
      const words = new Uint32Array(64);
      for (let i = 0; i < 16; i++) words[i] = bytes[offset + i * 4] << 24 | bytes[offset + i * 4 + 1] << 16 | bytes[offset + i * 4 + 2] << 8 | bytes[offset + i * 4 + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = rotateRight(words[i - 15], 7) ^ rotateRight(words[i - 15], 18) ^ words[i - 15] >>> 3;
        const s1 = rotateRight(words[i - 2], 17) ^ rotateRight(words[i - 2], 19) ^ words[i - 2] >>> 10;
        words[i] = words[i - 16] + s0 + words[i - 7] + s1;
      }
      let [a,b,c,d,e,f,g,h] = hash;
      for (let i = 0; i < 64; i++) {
        const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
        const choice = e & f ^ ~e & g;
        const temp1 = h + s1 + choice + constants[i] + words[i];
        const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
        const majority = a & b ^ a & c ^ b & c;
        const temp2 = s0 + majority;
        h=g; g=f; f=e; e=d+temp1; d=c; c=b; b=a; a=temp1+temp2;
      }
      [a,b,c,d,e,f,g,h].forEach((value, index) => { hash[index] = hash[index] + value; });
    }
    let output = hash.map(value => (value >>> 0).toString(16).padStart(8, "0")).join("");
    if (format === "sha256-upper") output = output.toUpperCase();
    return ok(output);
  }

  function unixTimestamp(input, format) {
    const value = input.trim();
    if (format === "timestamp-iso-to-seconds" || format === "timestamp-iso-to-milliseconds") {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return bad("warningTimestamp");
      const milliseconds = Date.parse(value);
      if (!Number.isFinite(milliseconds)) return bad("warningTimestamp");
      return ok(format.endsWith("seconds") ? String(Math.trunc(milliseconds / 1000)) : String(milliseconds));
    }
    if (!/^-?\d+$/.test(value)) return bad("warningTimestamp");
    let milliseconds;
    try {
      const integer = BigInt(value);
      const scaled = format === "timestamp-seconds-to-iso" ? integer * 1000n : integer;
      if (scaled < -8640000000000000n || scaled > 8640000000000000n) return bad("warningTimestamp");
      milliseconds = Number(scaled);
    } catch { return bad("warningTimestamp"); }
    try { return ok(new Date(milliseconds).toISOString()); } catch { return bad("warningTimestamp"); }
  }

  function wordFrequency(input, format) {
    const words = input.normalize("NFC").match(/[\p{L}\p{N}]+(?:[\p{M}'’_-]*[\p{L}\p{N}]+)*/gu) || [];
    if (!words.length) return bad("warningWords");
    const counts = new Map(), display = new Map();
    for (const word of words) {
      const key = format === "frequency-fold" ? word.toLocaleLowerCase("en") : word;
      if (!display.has(key)) display.set(key, format === "frequency-fold" ? key : word);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const result = Array.from(counts, ([key, count]) => ({ word: display.get(key), count })).sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, "en"));
    return ok(JSON.stringify(result, null, 2));
  }
  const normalizeLines = input => input.replace(/\r\n?/g, "\n").split("\n");
  function removeEmptyLines(input, format) {
    const lines = normalizeLines(input);
    return ok(lines.filter(line => format === "empty-strict" ? line !== "" : line.trim() !== "").join("\n"));
  }
  function addLineNumbers(input, format) {
    const width = format === "numbers-padded" ? Math.max(4, String(normalizeLines(input).length).length) : 0;
    return ok(normalizeLines(input).map((line, index) => `${width ? String(index + 1).padStart(width, "0") : index + 1}\t${line}`).join("\n"));
  }
  function reverseLines(input, format) {
    const normalized = input.replace(/\r\n?/g, "\n");
    const hasFinal = normalized.endsWith("\n");
    const lines = normalized.slice(0, hasFinal ? -1 : undefined).split("\n").reverse();
    return ok(lines.join("\n") + (format === "reverse-keep-final" && hasFinal ? "\n" : ""));
  }
  function duplicateLines(input, format) {
    const counts = new Map();
    normalizeLines(input).forEach((line, index) => {
      const key = format === "duplicates-fold" ? line.normalize("NFC").toLocaleLowerCase("en") : line;
      const item = counts.get(key) || { line, count: 0, lineNumbers: [] };
      item.count++; item.lineNumbers.push(index + 1); counts.set(key, item);
    });
    return ok(JSON.stringify(Array.from(counts.values()).filter(item => item.count > 1), null, 2));
  }

  const existing = window.asciiUnicodeUtilities || { converters: {}, warnings: {}, downloadExtensions: {} };
  Object.assign(existing.converters, {
    "json-formatter": jsonFormatter,
    "url-parser": urlParser,
    "punycode-converter": punycodeConverter,
    "xml-formatter": xmlFormatter,
    "json-to-xml": jsonToXml,
    "xml-to-json": xmlToJson,
    "text-compare": textCompare,
    "jwt-decoder": jwtDecoder,
    "hash-generator": sha256,
    "unix-timestamp-converter": unixTimestamp,
    "word-frequency-counter": wordFrequency,
    "remove-empty-lines": removeEmptyLines,
    "add-line-numbers": addLineNumbers,
    "reverse-lines": reverseLines,
    "duplicate-line-finder": duplicateLines,
  });
  Object.assign(existing.warnings, {
    warningJsonFormat: "Enter strict JSON. Unsafe integer literals, comments, trailing commas, NaN and missing values are rejected.",
    warningUrlAbsolute: "Enter a complete absolute HTTP or HTTPS URL.",
    warningPunycodeDomain: "Enter valid DNS labels without spaces. Each label must fit the 63-byte DNS limit.",
    warningXmlSyntax: "Enter one well-formed XML root. Mismatched tags, invalid entities and DOCTYPE declarations are rejected.",
    warningJsonXml: "Enter a JSON object with XML-safe property names and integers inside JavaScript's exact range.",
    warningCompareSeparator: "Put a line containing only ---COMPARE--- between the left and right text.",
    warningJwt: "Enter a three-part JWT whose header and payload are valid UTF-8 JSON objects.",
    warningJwtUnverified: "Decoded locally only. The JWT signature and claims have not been verified.",
    warningUnicodeScalar: "The input contains an unpaired UTF-16 surrogate and is not valid Unicode scalar text.",
    warningTimestamp: "Use a whole Unix timestamp, or a complete ISO 8601 date-time with Z or an explicit offset.",
    warningWords: "No Unicode word tokens were found.",
  });
  Object.assign(existing.downloadExtensions, {
    "json-formatter": "json",
    "url-parser": "json",
    "xml-formatter": "xml",
    "json-to-xml": "xml",
    "xml-to-json": "json",
    "text-compare": "json",
    "jwt-decoder": "json",
    "word-frequency-counter": "json",
    "duplicate-line-finder": "json",
  });
  window.asciiUnicodeUtilities = existing;
})();
