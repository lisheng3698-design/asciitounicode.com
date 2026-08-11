(function () {
  "use strict";

  const controlNames = [
    ["NUL", "Null"], ["SOH", "Start of Heading"], ["STX", "Start of Text"], ["ETX", "End of Text"],
    ["EOT", "End of Transmission"], ["ENQ", "Enquiry"], ["ACK", "Acknowledge"], ["BEL", "Bell"],
    ["BS", "Backspace"], ["HT", "Horizontal Tab"], ["LF", "Line Feed"], ["VT", "Vertical Tab"],
    ["FF", "Form Feed"], ["CR", "Carriage Return"], ["SO", "Shift Out"], ["SI", "Shift In"],
    ["DLE", "Data Link Escape"], ["DC1", "Device Control 1"], ["DC2", "Device Control 2"], ["DC3", "Device Control 3"],
    ["DC4", "Device Control 4"], ["NAK", "Negative Acknowledge"], ["SYN", "Synchronous Idle"], ["ETB", "End of Transmission Block"],
    ["CAN", "Cancel"], ["EM", "End of Medium"], ["SUB", "Substitute"], ["ESC", "Escape"],
    ["FS", "File Separator"], ["GS", "Group Separator"], ["RS", "Record Separator"], ["US", "Unit Separator"]
  ];

  const symbolNames = {
    32: "Space", 33: "Exclamation mark", 34: "Quotation mark", 35: "Number sign", 36: "Dollar sign",
    37: "Percent sign", 38: "Ampersand", 39: "Apostrophe", 40: "Left parenthesis", 41: "Right parenthesis",
    42: "Asterisk", 43: "Plus sign", 44: "Comma", 45: "Hyphen-minus", 46: "Full stop", 47: "Solidus",
    58: "Colon", 59: "Semicolon", 60: "Less-than sign", 61: "Equals sign", 62: "Greater-than sign",
    63: "Question mark", 64: "Commercial at", 91: "Left square bracket", 92: "Reverse solidus",
    93: "Right square bracket", 94: "Circumflex accent", 95: "Low line", 96: "Grave accent",
    123: "Left curly bracket", 124: "Vertical line", 125: "Right curly bracket", 126: "Tilde"
  };

  function printableName(code) {
    if (code >= 48 && code <= 57) return `Digit ${String.fromCharCode(code)}`;
    if (code >= 65 && code <= 90) return `Latin capital letter ${String.fromCharCode(code)}`;
    if (code >= 97 && code <= 122) return `Latin small letter ${String.fromCharCode(code)}`;
    return symbolNames[code] || "Printable character";
  }

  function createAsciiRows() {
    return Array.from({ length: 128 }, (_, decimal) => {
      const control = decimal < 32 ? controlNames[decimal] : (decimal === 127 ? ["DEL", "Delete"] : null);
      return {
        decimal,
        hex: decimal.toString(16).toUpperCase().padStart(2, "0"),
        octal: decimal.toString(8).padStart(3, "0"),
        binary: decimal.toString(2).padStart(7, "0"),
        character: control ? control[0] : String.fromCharCode(decimal),
        name: control ? control[1] : printableName(decimal),
        category: control ? "control" : "printable"
      };
    });
  }

  function filterAsciiRows(rows, query = "", category = "all") {
    const needle = String(query).trim().toLowerCase();
    return rows.filter((row) => {
      if (category !== "all" && row.category !== category) return false;
      if (!needle) return true;
      if (needle.length === 1 && !/[0-9]/.test(needle)) return row.character === String(query).trim();
      if (/^[0-9]+$/.test(needle)) {
        return String(row.decimal) === needle || row.hex.toLowerCase() === needle || row.octal === needle || row.binary === needle;
      }
      return [row.character, row.name, row.category, row.hex, row.octal, row.binary]
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }

  function track(name, details) {
    const safe = Object.assign({}, details);
    delete safe.query;
    window.asciiUnicodeEvents = window.asciiUnicodeEvents || [];
    window.asciiUnicodeEvents.push({ event: name, details: safe, timestamp: new Date().toISOString() });
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name, ...safe });
    if (typeof window.gtag === "function") window.gtag("event", name, safe);
  }

  function init() {
    const search = document.getElementById("ascii-search");
    const category = document.getElementById("ascii-category");
    const body = document.getElementById("ascii-table-body");
    const status = document.getElementById("ascii-table-status");
    if (!search || !category || !body || !status) return;
    const rows = createAsciiRows();

    function localized(key, fallback) {
      const lang = document.documentElement.lang === "zh-CN" ? "zh" : document.documentElement.lang.split("-")[0];
      return window.asciiUnicodeI18n?.pages?.asciiTable?.[lang]?.[key] || fallback;
    }

    function refresh(trackSearch) {
      const visible = new Set(filterAsciiRows(rows, search.value, category.value).map((row) => row.decimal));
      body.querySelectorAll("tr[data-ascii-code]").forEach((row) => {
        row.hidden = !visible.has(Number(row.dataset.asciiCode));
      });
      status.textContent = visible.size
        ? localized("statusMatches", "{count} of 128 rows shown").replace("{count}", String(visible.size))
        : localized("statusNoMatches", "No matching ASCII codes");
      if (trackSearch) track("ascii_table_filter", { result_count: visible.size, category: category.value });
    }

    search.addEventListener("input", () => refresh(true));
    category.addEventListener("change", () => refresh(true));
    body.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-copy-code]");
      if (!button) return;
      const row = rows[Number(button.dataset.copyCode)];
      const value = [row.character, row.decimal, row.hex, row.octal, row.binary, row.name].join("\t");
      try {
        await navigator.clipboard.writeText(value);
      } catch (error) {
        const helper = document.createElement("textarea");
        helper.value = value;
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        helper.remove();
      }
      status.textContent = localized("statusCopied", "Copied ASCII row {code}").replace("{code}", String(row.decimal));
      track("ascii_table_copy", { ascii_code: row.decimal });
    });
    window.addEventListener("ascii-language-change", () => refresh(false));
    refresh(false);
  }

  window.asciiTableTools = { createAsciiRows, filterAsciiRows };
  document.addEventListener("DOMContentLoaded", init);
})();
