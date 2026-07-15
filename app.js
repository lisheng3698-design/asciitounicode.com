(function () {
  "use strict";

  const state = {
    mode: "decode",
    lang: "en",
    warningKey: ""
  };

  const translations = {
    zh: {
      skip: "跳到转换工具",
      navConverter: "转换器",
      navExamples: "示例",
      navFormats: "格式",
      navFaq: "FAQ",
      navOpen: "打开工具",
      eyebrow: "适合日志、代码、JSON 和乱码文本的免费浏览器工具",
      heroTitle: "ASCII to Unicode 转换器",
      heroLede: "解码 \\u0048、HTML 实体、U+1F680、十六进制字节和 mojibake 乱码为可读 Unicode。也可以在当前页面把文本编码回 Unicode 表示。",
      proofNoSignup: "无需注册",
      proofFree: "在线免费转换",
      toolKicker: "可交互工具",
      toolTitle: "在一个页面完成 ASCII-safe 文本到 Unicode 的转换",
      statusReady: "就绪",
      statusDone: "已转换",
      statusCopied: "已复制",
      statusCleared: "已清空",
      statusImported: "已导入",
      statusDownloaded: "已下载",
      modeDecode: "解码为 Unicode",
      modeEncode: "编码为转义",
      modeEntities: "HTML 实体",
      modeMojibake: "修复乱码",
      formatLabel: "输出格式",
      autoConvert: "自动转换",
      formatHelp: "当把可读文本编码为转义或实体时，会使用这个输出格式。",
      inputLabel: "ASCII 输入",
      inputHelp: "粘贴转义、实体、字节文本、JSON 字符串或乱码。",
      outputLabel: "Unicode 输出",
      charsLabel: "个字符",
      btnConvert: "转换",
      btnCopy: "复制",
      btnClear: "清空",
      btnSwap: "交换",
      btnImport: "导入 TXT",
      btnDownload: "下载结果",
      warningMalformed: "检测到可能不完整的转义序列，已尽量保留原文。",
      warningNoChange: "没有发现可转换内容，输出保留原文。",
      warningEmpty: "请输入需要转换的文本。",
      previewEyebrow: "转换前后",
      previewTitle: "从 ASCII-safe 文本得到可读 Unicode",
      previewText: "一个好的转换器应该立即显示结果，把用户留在同一个 URL，并在长说明开始前就先解决问题。",
      previewCaption: "这张预览图展示了 ASCII-safe 输入如何在同一页面变成可读 Unicode 输出。",
      landingEyebrow: "HTML 源码内直接渲染的落地页内容",
      whatTitle: "什么是 ASCII to Unicode 转换器？",
      whatP1: "ASCII to Unicode 转换器会把 ASCII-safe 的文本表示转换成真正可读的 Unicode 字符。开发者常在 JSON、日志、配置文件、数据库、浏览器输出和 API 返回里遇到这些转义形式。",
      whatP2: "本页面把转换器、说明、示例、支持格式和 FAQ 都放在同一个 canonical URL 上，让你不用在多个页面之间跳转就能解决问题。",
      howTitle: "如何把 ASCII 转成 Unicode",
      howIntro: "粘贴你的文本，选择对应问题的模式，然后在当前页面直接转换，不需要打开单独结果页。",
      step1Title: "粘贴转义或乱码文本",
      step1Text: "可以使用从日志、API、JSON 文件或旧数据库导出的 Unicode 转义、HTML 实体、U+ 记法、十六进制字节或 mojibake。",
      step2Title: "选择正确转换模式",
      step2Text: "解码为可读 Unicode、把文本编码为转义、转换 HTML 实体，或修复常见 mojibake 乱码。",
      step3Title: "复制或下载结果",
      step3Text: "结果保留在当前页面，可以复制到剪贴板，也可以下载为纯文本文件。",
      examplesEyebrow: "精选结果展示",
      examplesTitle: "ASCII to Unicode 转换示例",
      examplesText: "这些人工精选示例相当于结果展示区。它们直接展示工具能得到什么效果，同时避免创建低质量可索引 UGC 页面。",
      tryExample: "试试这个示例",
      exLogTitle: "解码日志转义",
      exLogText: "读取服务器日志或诊断输出中的转义文本。",
      exJsonTitle: "解码 JSON Unicode 转义",
      exJsonText: "把 JSON-safe 字符串还原成可读的多语言文本。",
      exEntityTitle: "解码 HTML 实体",
      exEntityText: "把 HTML 中复制出来的实体文本转换成可见符号。",
      exEmojiTitle: "解码 emoji 码点",
      exEmojiText: "用 U+ 记法处理 emoji 和基础 ASCII 之外的符号。",
      exMojibakeTitle: "修复 mojibake 乱码",
      exMojibakeText: "修复常见的 UTF-8 被误读为 Latin-1 后产生的乱码。",
      exEncodeTitle: "编码可读文本",
      exEncodeText: "为代码、文档或测试数据生成 Unicode 转义格式。",
      formatsTitle: "支持的 ASCII 和 Unicode 格式",
      formatsIntro: "转换器聚焦调试、解析、跨系统迁移文本时真正会遇到的格式。",
      formatUnicodeTitle: "Unicode 转义",
      formatHtmlTitle: "HTML 实体",
      formatHexTitle: "十六进制字节转义",
      formatBrokenTitle: "Mojibake 乱码",
      useTitle: "常见使用场景",
      useIntro: "一个精品转换页面应该同时满足快速工具意图和更深层搜索意图，这些是本页面重点覆盖的场景。",
      useLogsTitle: "日志和诊断",
      useLogsText: "解码转义 payload，让错误消息、姓名、emoji 和符号在调试时可读。",
      useApiTitle: "API 和 JSON",
      useApiText: "理解服务为了传输或兼容性而转义的非 ASCII 文本。",
      useHtmlTitle: "HTML 清理",
      useHtmlText: "在编辑或发布内容前，把数字实体转换成真实字符。",
      useTestsTitle: "测试数据和代码",
      useTestsText: "为 fixture、快照、文档和跨语言示例生成稳定的转义字符串。",
      compareTitle: "ASCII、Unicode 和 UTF-8 的区别",
      compareIntro: "ASCII 是只覆盖基础英文字符、数字和控制字符的小字符集。Unicode 是覆盖现代文字系统、emoji、符号等内容的字符标准。UTF-8 是把 Unicode 存储成字节的常见方式。",
      compareNote: "很多让人困惑的字符串，都是字节、字符和转义格式混在一起导致的。这个工具帮助你检查表示方式，并恢复原本想读取的文本。",
      faqEyebrow: "常见问题",
      faqTitle: "ASCII to Unicode FAQ",
      faq1Q: "什么是 ASCII to Unicode 转换器？",
      faq1A: "它把 Unicode 转义、HTML 实体、U+ 码点等 ASCII-safe 文本表示解码成可读 Unicode，也可以把可读文本编码回这些格式。",
      faq2Q: "是否支持 \\uXXXX 和 emoji？",
      faq2A: "支持。它可以处理 \\uXXXX、\\u{1F600}、\\uD83D\\uDE00 这样的代理对，以及 emoji 和符号的 U+ 记法。",
      faq3Q: "可以解码 HTML 实体吗？",
      faq3A: "可以。十进制和十六进制数字实体，例如 &#9731; 和 &#x2603;，都可以转换成可见 Unicode 字符。",
      faq4Q: "为什么会出现 mojibake 乱码？",
      faq4A: "mojibake 通常是 UTF-8 字节被当成其他编码解释造成的。修复模式会在这种模式存在时尝试恢复原始 UTF-8 文本。",
      faq5Q: "转换过程是私密的吗？",
      faq5A: "是。转换在你的浏览器本地运行。Google Analytics 会记录页面和操作事件，但不会接收你粘贴的输入文本或转换后的输出文本。",
      faq6Q: "后续会加入更多相关转换器吗？",
      faq6A: "只有当相关转换器能解决明确的文本转换问题时才会加入。当前第一版会专注于 ASCII to Unicode 转换。",
      privacyTitle: "隐私说明",
      privacyText: "你粘贴的文本会留在浏览器中。转换器不需要账号，不会上传 TXT 文件，也不会把转换历史保存在我们的服务器上。",
      privacyText2: "语言偏好会保存在你的浏览器本地。Google Analytics 会记录页面使用情况以及转换、复制、下载等操作，但不会发送输入、输出或导入的 TXT 内容。",
      privacyLink: "阅读完整隐私政策",
      aboutTitle: "关于",
      aboutText: "ASCII to Unicode 是一个聚焦文本转换的页面，服务于需要从转义或乱码文本中读取 Unicode 的开发者、写作者、本地化编辑、QA 测试和运营人员。",
      aboutText2: "页面刻意保持聚焦：一个转换器、精选示例、支持格式，以及围绕常见文本编码问题的实用说明。",
      termsTitle: "使用条款",
      termsText: "你可以把本工具用于文本检查、调试、内容清理和测试数据准备。重要输出用于生产、法律、医疗或金融场景前请自行验证。",
      termsText2: "你需要对自己处理的文本负责，并遵守转换结果所使用系统的相关规则。",
      termsLink: "阅读完整使用条款",
      contactTitle: "联系",
      contactText: "如需反馈修正、功能建议、无障碍问题或隐私问题，请联系：",
      contactText2: "报告转换问题时，请说明转换模式和期望输出。请不要发送密钥或私密文本。",
      contactLink: "打开联系页面",
      footerPrivacy: "隐私",
      footerTerms: "条款",
      footerContact: "联系"
    }
  };
  if (window.asciiUnicodeI18n && window.asciiUnicodeI18n.home) {
    Object.assign(translations, window.asciiUnicodeI18n.home);
  }
  const activePage = document.body && document.body.dataset.page;
  Object.assign(translations.zh, {
    topLabel: "顶部",
    formatDecimal: "HTML 十进制",
    formatHex: "HTML 十六进制",
    formatUnicodeText: "\\u0048、\\u{1F600}、\\uD83D\\uDE00、%u4F60 和 U+1F680。",
    formatHtmlText: "&#9731; 和 &#x2603; 可以解码为可读符号，也可以从输入文本生成。",
    formatHexText: "\\xE2\\x98\\x80 这类字节序列在组成有效字节流时会按 UTF-8 解码。",
    formatBrokenText: "如果原始字节是 UTF-8，cafÃ© 等常见乱码字符串可以被还原。",
    previewAlt: "ASCII 转义序列转换为可读 Unicode 文本的前后对比预览图",
    relatedEyebrow: "关联转换器",
    relatedTitle: "ASCII 与 Unicode 相关转换器",
    relatedText: "根据你需要的文本方向或表示格式，选择对应的专用转换器。",
    relatedUnicodeTitle: "Unicode to ASCII 转换器",
    relatedUnicodeText: "将 Unicode 文本编码为 \\uXXXX、HTML 实体或 U+ 码点。",
    relatedBinaryTitle: "ASCII to Binary 转换器",
    relatedBinaryText: "将 ASCII 字符转换为固定 8 位二进制组。",
    relatedHexTitle: "Hex to ASCII 转换器",
    relatedHexText: "将十六进制字节转换为 ASCII 或 UTF-8 文本。",
    relatedAsciiHexTitle: "ASCII to Hex 转换器",
    relatedAsciiHexText: "将 ASCII 或 UTF-8 文本编码为十六进制字节。"
  });
  if (activePage && window.asciiUnicodeI18n && window.asciiUnicodeI18n.pages[activePage]) {
    Object.entries(window.asciiUnicodeI18n.pages[activePage]).forEach(([lang, values]) => {
      translations[lang] = Object.assign({}, translations[lang] || {}, values);
    });
  }

  const els = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function initElements() {
    els.input = byId("input-text");
    els.output = byId("output-text");
    els.warning = byId("warning-line");
    els.status = byId("status-pill");
    els.charCount = byId("char-count");
    els.format = byId("format-select");
    els.selectRoot = document.querySelector("[data-custom-select]");
    els.selectButton = byId("format-select-button");
    els.selectValue = byId("format-select-value");
    els.selectMenu = byId("format-select-menu");
    els.selectOptions = Array.from(els.selectMenu.querySelectorAll(".select-option"));
    els.auto = byId("auto-convert");
    els.fileInput = byId("file-input");
  }

  function trackEvent(name, details = {}) {
    const safeDetails = Object.assign({}, details);
    delete safeDetails.input;
    delete safeDetails.output;
    const analyticsParams = {
      tool_mode: safeDetails.mode || state.mode,
      language: safeDetails.language || state.lang
    };
    if (safeDetails.format) analyticsParams.output_format = safeDetails.format;
    if (Number.isFinite(safeDetails.inputLength)) analyticsParams.input_length = safeDetails.inputLength;
    if (Number.isFinite(safeDetails.outputLength)) analyticsParams.output_length = safeDetails.outputLength;
    if (Number.isFinite(safeDetails.size)) analyticsParams.file_size = safeDetails.size;
    if (safeDetails.type) analyticsParams.event_type = safeDetails.type;
    if (safeDetails.sampleId) analyticsParams.sample_id = safeDetails.sampleId;
    window.asciiUnicodeEvents = window.asciiUnicodeEvents || [];
    window.asciiUnicodeEvents.push({
      event: name,
      details: safeDetails,
      timestamp: new Date().toISOString()
    });
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: name,
        ...analyticsParams
      });
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", name, analyticsParams);
    }
  }

  function t(key) {
    return translations[state.lang] && translations[state.lang][key] ? translations[state.lang][key] : null;
  }

  function setStatus(key) {
    const fallback = {
      statusReady: "Ready",
      statusDone: "Converted",
      statusCopied: "Copied",
      statusCleared: "Cleared",
      statusImported: "Imported",
      statusDownloaded: "Downloaded"
    };
    els.status.textContent = t(key) || fallback[key] || key;
  }

  function setWarning(key) {
    state.warningKey = key || "";
    const fallback = {
      warningMalformed: "Possible malformed escape sequence found. The original text was preserved where needed.",
      warningNoChange: "No convertible content was detected, so the original text is preserved.",
      warningEmpty: "Enter text to convert.",
      warningNonAscii: "Non-ASCII characters are marked as ????????. Use UTF-8 Bytes to encode them without ambiguity.",
      warningInvalidHex: "Use hexadecimal digits only. Separators and 0x or \\x prefixes are supported.",
      warningOddHex: "A byte needs two hexadecimal digits. Add the missing digit and try again.",
      warningInvalidUtf8: "The bytes are not valid UTF-8 throughout. Replacement characters mark invalid sequences.",
      warningNonAsciiHex: "Bytes above 7F are not standard ASCII and are shown as ?. Choose UTF-8 when the bytes encode multilingual text.",
      warningNonAsciiHexEncode: "Non-ASCII characters are marked as ??. Use UTF-8 Bytes to encode them without ambiguity."
    };
    const text = key ? (t(key) || fallback[key]) : "";
    els.warning.textContent = text || "";
    if (text) {
      trackEvent("error_shown", { mode: state.mode, type: key });
    }
  }

  function updateMode(mode) {
    state.mode = mode;
    document.querySelectorAll(".mode-tab").forEach((btn) => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    els.format.disabled = !["encode", "entities", "ascii-binary", "utf8-binary", "ascii-hex", "utf8-hex", "hex-to-text"].includes(mode);
    syncCustomSelect();
    trackEvent("mode_change", { mode });
    if (els.auto.checked) {
      convertNow();
    }
  }

  function closeCustomSelect() {
    if (!els.selectRoot) {
      return;
    }
    els.selectRoot.classList.remove("is-open");
    els.selectButton.setAttribute("aria-expanded", "false");
  }

  function openCustomSelect() {
    if (!els.selectRoot || els.format.disabled) {
      return;
    }
    els.selectRoot.classList.add("is-open");
    els.selectButton.setAttribute("aria-expanded", "true");
  }

  function syncCustomSelect() {
    if (!els.selectRoot) {
      return;
    }
    const selected = els.selectOptions.find((option) => option.dataset.value === els.format.value);
    const label = selected ? selected.textContent : els.format.options[els.format.selectedIndex].textContent;
    els.selectValue.textContent = label;
    els.selectButton.disabled = els.format.disabled;
    els.selectRoot.classList.toggle("is-disabled", els.format.disabled);
    els.selectOptions.forEach((option) => {
      const active = option.dataset.value === els.format.value;
      option.classList.toggle("is-selected", active);
      option.setAttribute("aria-selected", String(active));
      option.tabIndex = active ? 0 : -1;
    });
    if (els.format.disabled) {
      closeCustomSelect();
    }
  }

  function selectFormat(value) {
    if (els.format.disabled) {
      return;
    }
    els.format.value = value;
    syncCustomSelect();
    els.format.dispatchEvent(new Event("change", { bubbles: true }));
    closeCustomSelect();
    els.selectButton.focus();
  }

  function focusSelectOption(delta) {
    const enabledOptions = els.selectOptions;
    const currentIndex = Math.max(0, enabledOptions.findIndex((option) => option === document.activeElement || option.dataset.value === els.format.value));
    const nextIndex = (currentIndex + delta + enabledOptions.length) % enabledOptions.length;
    enabledOptions[nextIndex].focus();
  }

  function isMalformed(input) {
    return /\\u(?!\{[0-9a-fA-F]{1,6}\}|[0-9a-fA-F]{4})|%u(?![0-9a-fA-F]{4})|&#x(?![0-9a-fA-F]+;)|&#(?![0-9]+;)|U\+(?![0-9a-fA-F]{2,6})/.test(input);
  }

  function codePointToString(hex) {
    const point = Number.parseInt(hex, 16);
    if (!Number.isFinite(point) || point < 0 || point > 0x10ffff) {
      return null;
    }
    try {
      return String.fromCodePoint(point);
    } catch (error) {
      return null;
    }
  }

  function decodeByteRun(match) {
    const bytes = match.match(/\\x([0-9a-fA-F]{2})/g).map((part) => Number.parseInt(part.slice(2), 16));
    try {
      return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
    } catch (error) {
      return match;
    }
  }

  function decodeAsciiToUnicode(input) {
    let output = input;
    output = output.replace(/(?:\\x[0-9a-fA-F]{2})+/g, decodeByteRun);
    output = output.replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, (match, hex) => codePointToString(hex) || match);
    output = output.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
    output = output.replace(/%u([0-9a-fA-F]{4})/g, (match, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
    output = output.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => codePointToString(hex) || match);
    output = output.replace(/&#([0-9]+);/g, (match, dec) => {
      const point = Number.parseInt(dec, 10);
      try {
        return String.fromCodePoint(point);
      } catch (error) {
        return match;
      }
    });
    output = output.replace(/\bU\+([0-9a-fA-F]{2,6})\b/g, (match, hex) => codePointToString(hex) || match);
    return output;
  }

  function codePointHex(point, min = 4) {
    return point.toString(16).toUpperCase().padStart(min, "0");
  }

  function toSurrogateEscapes(point) {
    if (point <= 0xffff) {
      return "\\u" + codePointHex(point);
    }
    const shifted = point - 0x10000;
    const high = 0xd800 + (shifted >> 10);
    const low = 0xdc00 + (shifted & 0x3ff);
    return "\\u" + codePointHex(high) + "\\u" + codePointHex(low);
  }

  function encodeText(input, format, preserveAscii = false) {
    return Array.from(input).map((char) => {
      const point = char.codePointAt(0);
      if (preserveAscii && point <= 0x7f) {
        return char;
      }
      if (format === "js-brace") {
        return "\\u{" + codePointHex(point, point > 0xffff ? 5 : 4).replace(/^0+(?=[0-9A-F]{2,}$)/, "") + "}";
      }
      if (format === "html-dec") {
        return "&#" + point + ";";
      }
      if (format === "html-hex") {
        return "&#x" + codePointHex(point, point > 0xffff ? 5 : 4).replace(/^0+(?=[0-9A-F]{2,}$)/, "") + ";";
      }
      if (format === "uplus") {
        return "U+" + codePointHex(point, point > 0xffff ? 5 : 4).replace(/^0+(?=[0-9A-F]{4,}$)/, "");
      }
      return toSurrogateEscapes(point);
    }).join(format === "uplus" && !preserveAscii ? " " : "");
  }

  const asciiCharacterMap = Object.freeze({
    "ß": "ss", "ẞ": "SS", "Æ": "AE", "æ": "ae", "Œ": "OE", "œ": "oe",
    "Ø": "O", "ø": "o", "Ł": "L", "ł": "l", "Đ": "D", "đ": "d",
    "Ð": "D", "ð": "d", "Þ": "Th", "þ": "th", "ı": "i",
    "‘": "'", "’": "'", "‚": "'", "“": "\"", "”": "\"", "„": "\"",
    "–": "-", "—": "-", "−": "-", "…": "...", "•": "*", "·": ".",
    " ": " ", "×": "x", "÷": "/", "©": "(c)", "®": "(R)", "™": "TM",
    "€": "EUR", "£": "GBP", "¥": "JPY"
  });

  function isCombiningMark(char) {
    return /\p{M}/u.test(char);
  }

  function transliterateToAscii(input, unsupported = "?") {
    const mapped = Array.from(input, (char) => asciiCharacterMap[char] || char).join("");
    return Array.from(mapped.normalize("NFKD"), (char) => {
      if (char.codePointAt(0) <= 0x7f) {
        return char;
      }
      if (isCombiningMark(char)) {
        return "";
      }
      return unsupported;
    }).join("");
  }

  function replaceNonAscii(input, replacement = "?") {
    return Array.from(input, (char) => char.codePointAt(0) <= 0x7f ? char : replacement).join("");
  }

  function joinBinaryBytes(bytes, format) {
    const separator = format === "binary-compact" ? "" : (format === "binary-lines" ? "\n" : " ");
    return bytes.join(separator);
  }

  function asciiToBinary(input, format = "binary-space") {
    let hasNonAscii = false;
    const bytes = Array.from(input, (char) => {
      const point = char.codePointAt(0);
      if (point > 0x7f) {
        hasNonAscii = true;
        return "????????";
      }
      return point.toString(2).padStart(8, "0");
    });
    return { output: joinBinaryBytes(bytes, format), hasNonAscii };
  }

  function utf8ToBinary(input, format = "binary-space") {
    const bytes = Array.from(new TextEncoder().encode(input), (byte) => byte.toString(2).padStart(8, "0"));
    return joinBinaryBytes(bytes, format);
  }

  function formatHexBytes(bytes, format = "hex-space") {
    const pairs = bytes.map((byte) => byte === null ? "??" : byte.toString(16).toUpperCase().padStart(2, "0"));
    if (format === "hex-compact") {
      return pairs.join("");
    }
    if (format === "hex-prefix") {
      return pairs.map((pair) => "0x" + pair).join(" ");
    }
    if (format === "hex-escape") {
      return pairs.map((pair) => "\\x" + pair).join("");
    }
    return pairs.join(" ");
  }

  function asciiToHex(input, format = "hex-space") {
    let hasNonAscii = false;
    const bytes = Array.from(input, (char) => {
      const point = char.codePointAt(0);
      if (point > 0x7f) {
        hasNonAscii = true;
        return null;
      }
      return point;
    });
    return { output: formatHexBytes(bytes, format), hasNonAscii };
  }

  function utf8ToHex(input, format = "hex-space") {
    return formatHexBytes(Array.from(new TextEncoder().encode(input)), format);
  }

  function hexToText(input, format = "hex-utf8") {
    const compact = input
      .replace(/(?:0x|\\x)/gi, "")
      .replace(/[\s,;:_-]+/g, "");

    if (!compact || /[^0-9a-f]/i.test(compact)) {
      return { output: "", warning: "warningInvalidHex" };
    }
    if (compact.length % 2 !== 0) {
      return { output: "", warning: "warningOddHex" };
    }

    const bytes = compact.match(/.{2}/g).map((pair) => Number.parseInt(pair, 16));
    if (format === "hex-ascii") {
      let hasNonAscii = false;
      const output = bytes.map((byte) => {
        if (byte > 0x7f) {
          hasNonAscii = true;
          return "?";
        }
        return String.fromCharCode(byte);
      }).join("");
      return { output, warning: hasNonAscii ? "warningNonAsciiHex" : "" };
    }

    const output = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
    return { output, warning: output.includes("\uFFFD") ? "warningInvalidUtf8" : "" };
  }

  function convertEntities(input, format) {
    if (/&#x?[0-9a-fA-F]+;/.test(input)) {
      return decodeAsciiToUnicode(input);
    }
    return encodeText(input, format === "html-hex" ? "html-hex" : "html-dec");
  }

  function repairMojibake(input) {
    const withEscapedBytes = input.replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
    const bytes = new Uint8Array(Array.from(withEscapedBytes).map((char) => char.codePointAt(0) & 0xff));
    try {
      return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } catch (error) {
      return input;
    }
  }

  function convertValue(input, mode, format, options = {}) {
    if (!input) {
      return { output: "", warning: "warningEmpty" };
    }

    const warning = isMalformed(input) ? "warningMalformed" : "";
    let modeWarning = "";
    let output = input;

    if (mode === "decode") {
      output = decodeAsciiToUnicode(input);
    } else if (mode === "encode") {
      output = encodeText(input, format, Boolean(options.preserveAscii));
    } else if (mode === "entities") {
      output = convertEntities(input, format);
    } else if (mode === "mojibake") {
      output = repairMojibake(input);
    } else if (mode === "transliterate") {
      output = transliterateToAscii(input);
    } else if (mode === "ascii-replace") {
      output = replaceNonAscii(input);
    } else if (mode === "ascii-remove") {
      output = replaceNonAscii(input, "");
    } else if (mode === "ascii-binary") {
      const binary = asciiToBinary(input, format);
      output = binary.output;
      modeWarning = binary.hasNonAscii ? "warningNonAscii" : "";
    } else if (mode === "utf8-binary") {
      output = utf8ToBinary(input, format);
    } else if (mode === "ascii-hex") {
      const hex = asciiToHex(input, format);
      output = hex.output;
      modeWarning = hex.hasNonAscii ? "warningNonAsciiHexEncode" : "";
    } else if (mode === "utf8-hex") {
      output = utf8ToHex(input, format);
    } else if (mode === "hex-to-text") {
      const decoded = hexToText(input, format);
      output = decoded.output;
      modeWarning = decoded.warning;
    }

    return {
      output,
      warning: warning || modeWarning || (output === input && !["encode", "ascii-binary", "utf8-binary", "ascii-hex", "utf8-hex", "hex-to-text"].includes(mode) ? "warningNoChange" : "")
    };
  }

  function convertNow() {
    const result = convertValue(els.input.value, state.mode, els.format.value, {
      preserveAscii: document.body.dataset.preserveAscii === "true"
    });
    els.output.value = result.output;
    els.charCount.textContent = Array.from(result.output).length.toString();
    setWarning(result.warning);
    setStatus("statusDone");
    trackEvent("tool_convert", {
      mode: state.mode,
      format: els.format.value,
      inputLength: Array.from(els.input.value).length,
      outputLength: Array.from(result.output).length
    });
  }

  async function copyOutput() {
    if (!els.output.value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(els.output.value);
    } catch (error) {
      els.output.select();
      document.execCommand("copy");
    }
    setStatus("statusCopied");
    trackEvent("copy_output", { mode: state.mode, outputLength: Array.from(els.output.value).length });
  }

  function clearAll() {
    els.input.value = "";
    els.output.value = "";
    els.charCount.textContent = "0";
    setWarning("");
    setStatus("statusCleared");
  }

  function swapValues() {
    const currentInput = els.input.value;
    els.input.value = els.output.value;
    els.output.value = currentInput;
    els.charCount.textContent = Array.from(els.output.value).length.toString();
    if (els.auto.checked) {
      convertNow();
    }
  }

  function downloadOutput() {
    if (!els.output.value) {
      return;
    }
    const blob = new Blob([els.output.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ascii-to-unicode-output.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("statusDownloaded");
    trackEvent("download_output", { mode: state.mode, outputLength: Array.from(els.output.value).length });
  }

  function useSample(button) {
    const mode = button.dataset.mode || "decode";
    updateMode(mode);
    els.input.value = button.dataset.sample || "";
    convertNow();
    document.querySelector("#converter").scrollIntoView({ behavior: "smooth", block: "start" });
    trackEvent("example_try", { mode, sampleId: button.textContent.trim().slice(0, 40) });
  }

  function applyLanguage(lang) {
    state.lang = translations[lang] ? lang : "en";
    const language = window.asciiUnicodeI18n && window.asciiUnicodeI18n.languages[state.lang];
    document.documentElement.lang = language ? language.htmlLang : "en";
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.dataset.i18n;
      if (state.lang !== "en" && translations[state.lang] && translations[state.lang][key]) {
        node.textContent = translations[state.lang][key];
      } else if (node.dataset.en) {
        node.textContent = node.dataset.en;
      }
    });
    document.querySelectorAll("[data-i18n-alt]").forEach((node) => {
      const key = node.dataset.i18nAlt;
      node.alt = state.lang !== "en" && translations[state.lang] && translations[state.lang][key]
        ? translations[state.lang][key]
        : node.dataset.enAlt;
    });
    localStorage.setItem("ascii-unicode-lang", state.lang);
    syncCustomSelect();
    setStatus("statusReady");
    if (state.warningKey) {
      setWarning(state.warningKey);
    }
  }

  function cacheEnglishText() {
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      if (!node.dataset.en) {
        node.dataset.en = node.textContent;
      }
    });
    document.querySelectorAll("[data-i18n-alt]").forEach((node) => {
      node.dataset.enAlt = node.alt;
    });
  }

  function bindEvents() {
    document.querySelectorAll(".mode-tab").forEach((button) => {
      button.addEventListener("click", () => updateMode(button.dataset.mode));
    });
    els.selectButton.addEventListener("click", () => {
      if (els.selectRoot.classList.contains("is-open")) {
        closeCustomSelect();
      } else {
        openCustomSelect();
      }
    });
    els.selectButton.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCustomSelect();
        const selected = els.selectOptions.find((option) => option.dataset.value === els.format.value) || els.selectOptions[0];
        selected.focus();
      }
      if (event.key === "Escape") {
        closeCustomSelect();
      }
    });
    els.selectOptions.forEach((option) => {
      option.addEventListener("click", () => selectFormat(option.dataset.value));
      option.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectFormat(option.dataset.value);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          focusSelectOption(1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          focusSelectOption(-1);
        } else if (event.key === "Home") {
          event.preventDefault();
          els.selectOptions[0].focus();
        } else if (event.key === "End") {
          event.preventDefault();
          els.selectOptions[els.selectOptions.length - 1].focus();
        } else if (event.key === "Escape") {
          closeCustomSelect();
          els.selectButton.focus();
        }
      });
    });
    document.addEventListener("click", (event) => {
      if (els.selectRoot && !els.selectRoot.contains(event.target)) {
        closeCustomSelect();
      }
    });
    byId("convert-btn").addEventListener("click", convertNow);
    byId("copy-btn").addEventListener("click", copyOutput);
    byId("clear-btn").addEventListener("click", clearAll);
    const swapButton = byId("swap-btn");
    if (swapButton) {
      swapButton.addEventListener("click", swapValues);
    }
    byId("download-btn").addEventListener("click", downloadOutput);
    byId("import-btn").addEventListener("click", () => els.fileInput.click());
    els.input.addEventListener("input", () => {
      if (els.auto.checked) {
        convertNow();
      }
    });
    els.format.addEventListener("change", () => {
      syncCustomSelect();
      if (els.auto.checked) {
        convertNow();
      }
    });
    els.fileInput.addEventListener("change", async () => {
      const file = els.fileInput.files && els.fileInput.files[0];
      if (!file) {
        return;
      }
      els.input.value = await file.text();
      setStatus("statusImported");
      trackEvent("tool_import", { size: file.size, type: file.type || "text/plain" });
      convertNow();
      els.fileInput.value = "";
    });
    document.querySelectorAll(".sample-chip, .example-btn").forEach((button) => {
      button.addEventListener("click", () => useSample(button));
    });
    window.addEventListener("ascii-language-change", (event) => {
      const lang = event.detail && event.detail.language;
      if (!lang || lang === state.lang) {
        return;
      }
      applyLanguage(lang);
      if (event.detail.track) {
        trackEvent("language_switch", { language: lang });
      }
    });
  }

  function init() {
    initElements();
    cacheEnglishText();
    bindEvents();
    const savedLang = localStorage.getItem("ascii-unicode-lang");
    if (savedLang && translations[savedLang]) {
      applyLanguage(savedLang);
    }
    const requestedMode = document.body.dataset.defaultMode || "decode";
    const defaultMode = ["decode", "encode", "entities", "mojibake", "transliterate", "ascii-replace", "ascii-remove", "ascii-binary", "utf8-binary", "ascii-hex", "utf8-hex", "hex-to-text"].includes(requestedMode)
      ? requestedMode
      : "decode";
    updateMode(defaultMode);
    convertNow();
  }

  window.asciiUnicodeTools = {
    convertValue,
    decodeAsciiToUnicode,
    encodeText,
    asciiToBinary,
    utf8ToBinary,
    asciiToHex,
    utf8ToHex,
    hexToText,
    transliterateToAscii,
    replaceNonAscii,
    repairMojibake
  };

  document.addEventListener("DOMContentLoaded", init);
})();
