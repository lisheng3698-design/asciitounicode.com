const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

test("homepage has compact SEO metadata and one H1", () => {
  const html = read("index.html");
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1].replace(/&amp;/g, "&");
  const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
  assert.equal(title, "ASCII to Unicode Converter - Decode & Encode Online");
  assert.ok(title.length <= 60, `title length ${title.length}`);
  assert.ok(description.length <= 160, `description length ${description.length}`);
  assert.match(html, /<link rel="canonical" href="https:\/\/asciitounicode\.com\/">/);
  assert.match(html, /<link rel="icon" href="favicon\.svg" type="image\/svg\+xml">/);
  assert.match(html, /<body id="top" data-page="home">/);
  assert.equal(countMatches(html, /<h1\b/g), 1);
  assert.equal(countMatches(html, /name="keywords"/g), 0);
});

test("homepage source includes crawlable content, examples, image alt, and JSON-LD", () => {
  const html = read("index.html");
  assert.match(html, /What Is an ASCII to Unicode Converter\?/);
  assert.match(html, /ASCII to Unicode Converter Examples/);
  assert.match(html, /Supported ASCII and Unicode Formats/);
  assert.match(html, /ASCII to Unicode FAQ/);
  assert.match(html, /alt="Before and after preview showing ASCII escape sequences converted into readable Unicode text"/);
  assert.match(html, /class="select-wrap custom-select"/);
  assert.match(html, /class="brand-logo"/);
  assert.match(html, /class="code-stream"/);
  assert.ok(countMatches(html, /class="drift-left"/g) >= 16);
  assert.ok(countMatches(html, /class="drift-right"/g) >= 16);
  assert.match(html, /class="logo-arrow" d="M38 13h6q4 0 4 4v3"/);
  assert.match(html, /class="top-button" href="#top"/);
  assert.equal(countMatches(html, /<span data-i18n="proof/g), 2);
  assert.match(html, /data-i18n="proofNoSignup">No signup/);
  assert.match(html, /data-i18n="proofFree">Free online conversion/);
  assert.doesNotMatch(html, /proofPrivate|proofNoJump|No result-page jump|Local browser conversion/);
  assert.match(html, /id="format-select-button"/);
  assert.match(html, /role="listbox"/);
  assert.match(html, /class="language-select custom-select" data-language-select/);
  assert.equal(countMatches(html, /class="select-option language-option(?: is-selected)?"/g), 8);
  assert.doesNotMatch(html, /<select[^>]+language|class="language-toggle"|class="lang-btn/);
  assert.match(html, /href="privacy\.html"/);
  assert.match(html, /href="terms\.html"/);
  assert.match(html, /href="contact\.html"/);
  assert.match(html, /mailto:lisheng3698@gmail\.com/);
  assert.equal(countMatches(html, /application\/ld\+json/g), 3);
  assert.match(html, /"@type": "WebApplication"/);
  assert.match(html, /"@type": "HowTo"/);
  assert.match(html, /"@type": "FAQPage"/);
});

test("layout styles keep modules aligned and requested card groups two-up", () => {
  const css = read("styles.css");
  assert.match(css, /--page: min\(1180px, calc\(100% - 32px\)\);/);
  assert.match(css, /\.nav-shell\s*\{[\s\S]*?width: var\(--page\);/);
  assert.match(css, /\.hero-tool\s*\{[\s\S]*?width: var\(--page\);/);
  assert.match(css, /\.visual-band,\s*\n\.content-section\s*\{[\s\S]*?width: var\(--page\);/);
  assert.match(css, /\.text-grid\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(css, /\.step-list\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(css, /\.example-grid,[\s\S]*?\.trust-section\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(css, /body\s*\{[\s\S]*?font-family: var\(--sans\);/);
  assert.match(css, /--sans: var\(--mono\);/);
  assert.match(css, /\.hero-copy h1\s*\{[\s\S]*?text-transform: uppercase;/);
  assert.match(css, /\.panel-head > div\s*\{[\s\S]*?flex: 1 1 auto;/);
  assert.match(css, /\.panel-head h2\s*\{[\s\S]*?max-width: none;/);
  assert.match(css, /\.native-select\s*\{[\s\S]*?opacity: 0;/);
  assert.match(css, /\.select-button\s*\{[\s\S]*?border: 1px solid rgba\(50, 255, 102, 0\.5\);/);
  assert.match(css, /\.example-btn\s*\{[\s\S]*?border-color: rgba\(50, 255, 102, 0\.5\);/);
  assert.match(css, /\.preview-frame img\s*\{[\s\S]*?width: 100%;/);
  assert.match(css, /\.brand-mark\s*\{[\s\S]*?width: 42px;[\s\S]*?height: 42px;/);
  assert.match(css, /\.logo-arrow\s*\{[\s\S]*?stroke: var\(--amber\);/);
  assert.match(css, /\.logo-arrow\s*\{[\s\S]*?stroke-width: 2;/);
  assert.match(css, /\.logo-shadow\s*\{[\s\S]*?stroke: rgba\(50, 255, 102, 0\.54\);/);
  assert.doesNotMatch(css, /\.logo-pulse/);
  assert.match(css, /\.code-stream\s*\{[\s\S]*?position: fixed;/);
  assert.match(css, /@keyframes code-drift/);
  assert.match(css, /38%\s*\{[\s\S]*?opacity: 0\.1;/);
  assert.match(css, /100%\s*\{[\s\S]*?opacity: 0;/);
  assert.match(css, /\.section-copy\s*\{[\s\S]*?max-width: none;/);
  assert.match(css, /\.select-wrap > span\s*\{[\s\S]*?white-space: nowrap;/);
  assert.match(css, /\.select-wrap > span\s*\{[\s\S]*?writing-mode: horizontal-tb;/);
  assert.match(css, /\.custom-select-control\s*\{[\s\S]*?width: min\(332px, 100%\);/);
  assert.match(css, /\.top-button\s*\{[\s\S]*?position: fixed;/);
  assert.match(css, /\.top-button\s*\{[\s\S]*?right: clamp\(16px, 2vw, 28px\);/);
  assert.match(css, /\.language-select\s*\{[\s\S]*?width: 170px;[\s\S]*?flex: 0 0 170px;/);
  assert.match(css, /\.language-menu\s*\{[\s\S]*?max-height:/);
  assert.match(css, /\.language-select \.language-menu\s*\{[\s\S]*?right: 0;[\s\S]*?left: auto;/);
});

test("404 page is present, useful, and noindexed", () => {
  const html = read("404.html");
  assert.match(html, /<title>Page Not Found - ASCII to Unicode<\/title>/);
  assert.match(html, /<meta name="robots" content="noindex, follow">/);
  assert.match(html, /<h1 id="not-found-title" data-i18n="notFoundH1">Page Not Found<\/h1>/);
  assert.match(html, /href="\.\/#converter"/);
  assert.equal(countMatches(html, /<h1\b/g), 1);
});

test("privacy, terms, and contact pages are complete static trust pages", () => {
  const pages = [
    ["privacy.html", "Privacy Policy - ASCII to Unicode", "Privacy Policy", /Local Conversion/, /Analytics Events/],
    ["terms.html", "Terms of Use - ASCII to Unicode", "Terms of Use", /Permitted Use/, /No Warranty/],
    ["contact.html", "Contact - ASCII to Unicode", "Contact ASCII to Unicode", /Converter Feedback/, /Accessibility/]
  ];

  for (const [file, title, h1, firstNeedle, secondNeedle] of pages) {
    const html = read(file);
    assert.match(html, new RegExp(`<title>${title}<\\/title>`));
    assert.match(html, /<meta name="robots" content="noindex, follow">/);
    assert.match(html, /<link rel="icon" href="favicon\.svg" type="image\/svg\+xml">/);
    assert.match(html, /class="brand-logo"/);
    assert.match(html, new RegExp(`<h1 data-i18n="[^"]+">${h1}<\\/h1>`));
    assert.match(html, firstNeedle);
    assert.match(html, secondNeedle);
    assert.match(html, /href="\.\/#converter"/);
    assert.match(html, /href="mailto:lisheng3698@gmail\.com"/);
    assert.equal(countMatches(html, /<h1\b/g), 1);
  }
});

test("all public pages use the same eight-language custom listbox", () => {
  for (const file of ["index.html", "privacy.html", "terms.html", "contact.html", "404.html"]) {
    const html = read(file);
    assert.match(html, /data-language-select/, `${file} language selector`);
    assert.equal(countMatches(html, /class="select-option language-option(?: is-selected)?"/g), 8, `${file} language count`);
    assert.match(html, /<script src="translations\.js" defer><\/script>/, `${file} translations script`);
    assert.match(html, /<script src="site-language\.js" defer><\/script>/, `${file} language script`);
    assert.doesNotMatch(html, /<select[^>]+language/i, `${file} must not use a native language select`);
  }
});

test("translation packs cover every key and preserve ASCII to Unicode", () => {
  const context = { window: {} };
  vm.runInNewContext(read("translations.js"), context);
  const i18n = context.window.asciiUnicodeI18n;
  const languages = ["en", "zh", "es", "pt", "fr", "de", "ja", "ko"];
  assert.deepEqual(Object.keys(i18n.languages), languages);

  for (const lang of ["es", "pt", "fr", "de", "ja", "ko"]) {
    assert.equal(Object.keys(i18n.home[lang]).length, 130, `${lang} homepage keys`);
    assert.match(i18n.home[lang].heroTitle, /ASCII to Unicode/, `${lang} fixed keyword`);
  }

  for (const page of ["privacy", "terms", "contact", "notFound"]) {
    const expectedCount = Object.keys(i18n.pages[page].zh).length;
    for (const lang of ["zh", "es", "pt", "fr", "de", "ja", "ko"]) {
      assert.equal(Object.keys(i18n.pages[page][lang]).length, expectedCount, `${page}/${lang} keys`);
      assert.ok(Object.values(i18n.pages[page][lang]).every(Boolean), `${page}/${lang} has no blank translations`);
      assert.match(i18n.meta[page][lang].title, /ASCII to Unicode/, `${page}/${lang} title keyword`);
    }
  }
});

test("preview image asset is regenerated and kept at the stable public path", () => {
  const html = read("index.html");
  const png = fs.statSync(path.join(root, "assets", "ascii-unicode-preview.png"));
  const svg = read("assets/ascii-unicode-preview.svg");
  const favicon = read("favicon.svg");
  assert.match(html, /src="assets\/ascii-unicode-preview\.png\?v=20260711-2"/);
  assert.ok(png.size > 10000, `preview png size ${png.size}`);
  assert.match(svg, /ASCII-safe input/);
  assert.match(svg, /Unicode output/);
  assert.match(favicon, /ASCII to Unicode favicon/);
  assert.match(favicon, /\\u/);
  assert.match(favicon, /U\+/);
  assert.match(favicon, /rotate\(-8 25 27\)/);
  assert.doesNotMatch(favicon, /logo-pulse|14 44h9/);
});

test("hero proof labels are simplified in Chinese translation", () => {
  const js = read("app.js");
  assert.match(js, /proofNoSignup: "无需注册"/);
  assert.match(js, /proofFree: "在线免费转换"/);
  assert.doesNotMatch(js, /proofPrivate|proofNoJump|浏览器本地转换|不跳转结果页/);
});

test("robots and sitemap point to the canonical production URL", () => {
  assert.match(read("robots.txt"), /Sitemap: https:\/\/asciitounicode\.com\/sitemap\.xml/);
  assert.match(read("sitemap.xml"), /<loc>https:\/\/asciitounicode\.com\/<\/loc>/);
});

test("public pages do not expose internal strategy wording", () => {
  const combined = [
    "index.html",
    "404.html",
    "privacy.html",
    "terms.html",
    "contact.html",
    "app.js"
  ].map(read).join("\n");
  assert.doesNotMatch(combined, /boutique tool page|One keyword|一个关键词|精品工具页/);
  assert.doesNotMatch(combined, /hello@asciitounicode\.com/);
});
