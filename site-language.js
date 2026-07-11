(function () {
  "use strict";

  const config = window.asciiUnicodeI18n;
  if (!config) {
    return;
  }

  const page = document.body.dataset.page || "home";
  const selectors = Array.from(document.querySelectorAll("[data-language-select]"));
  const cachedEnglish = new Map();
  const cachedTitle = document.title;
  const descriptionNode = document.querySelector('meta[name="description"]');
  const cachedDescription = descriptionNode ? descriptionNode.getAttribute("content") : "";

  function localeData(lang) {
    return Object.assign({}, config.common[lang] || {}, (config.pages[page] && config.pages[page][lang]) || {});
  }

  function cacheEnglish() {
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      cachedEnglish.set(node, node.textContent);
    });
  }

  function closeSelector(root, restoreFocus) {
    root.classList.remove("is-open");
    const button = root.querySelector(".language-select-button");
    button.setAttribute("aria-expanded", "false");
    if (restoreFocus) {
      button.focus();
    }
  }

  function openSelector(root) {
    selectors.forEach((item) => {
      if (item !== root) {
        closeSelector(item, false);
      }
    });
    root.classList.add("is-open");
    root.querySelector(".language-select-button").setAttribute("aria-expanded", "true");
  }

  function updateSelector(root, lang) {
    const language = config.languages[lang] || config.languages.en;
    root.querySelector("[data-language-value]").textContent = language.label;
    root.querySelectorAll(".language-option").forEach((option) => {
      const selected = option.dataset.lang === lang;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-selected", String(selected));
    });
  }

  function updateMetadata(lang) {
    if (lang === "en") {
      document.title = cachedTitle;
      if (descriptionNode) {
        descriptionNode.setAttribute("content", cachedDescription);
      }
      return;
    }
    const metadata = config.meta[page] && config.meta[page][lang];
    if (!metadata) {
      return;
    }
    document.title = metadata.title;
    if (descriptionNode) {
      descriptionNode.setAttribute("content", metadata.description);
    }
  }

  function applyLanguage(lang, track) {
    const nextLang = config.languages[lang] ? lang : "en";
    const language = config.languages[nextLang];
    const data = localeData(nextLang);

    document.documentElement.lang = language.htmlLang;
    if (page !== "home") {
      document.querySelectorAll("[data-i18n]").forEach((node) => {
        const translated = data[node.dataset.i18n];
        node.textContent = nextLang === "en" ? cachedEnglish.get(node) : (translated || cachedEnglish.get(node));
      });
    }
    updateMetadata(nextLang);
    selectors.forEach((root) => updateSelector(root, nextLang));
    localStorage.setItem("ascii-unicode-lang", nextLang);

    window.dispatchEvent(new CustomEvent("ascii-language-change", {
      detail: { language: nextLang, track: Boolean(track) }
    }));

    if (track && page !== "home") {
      window.asciiUnicodeEvents = window.asciiUnicodeEvents || [];
      window.asciiUnicodeEvents.push({
        event: "language_switch",
        details: { language: nextLang },
        timestamp: new Date().toISOString()
      });
    }
  }

  function focusOption(root, direction) {
    const options = Array.from(root.querySelectorAll(".language-option"));
    const current = options.indexOf(document.activeElement);
    options[(current + direction + options.length) % options.length].focus();
  }

  function bindSelector(root) {
    const button = root.querySelector(".language-select-button");
    const options = Array.from(root.querySelectorAll(".language-option"));

    button.addEventListener("click", () => {
      if (root.classList.contains("is-open")) {
        closeSelector(root, false);
      } else {
        openSelector(root);
      }
    });
    button.addEventListener("keydown", (event) => {
      if (["ArrowDown", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openSelector(root);
        (options.find((option) => option.classList.contains("is-selected")) || options[0]).focus();
      } else if (event.key === "Escape") {
        closeSelector(root, false);
      }
    });
    options.forEach((option) => {
      option.addEventListener("click", () => {
        applyLanguage(option.dataset.lang, true);
        closeSelector(root, true);
      });
      option.addEventListener("keydown", (event) => {
        if (["Enter", " "].includes(event.key)) {
          event.preventDefault();
          applyLanguage(option.dataset.lang, true);
          closeSelector(root, true);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          focusOption(root, 1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          focusOption(root, -1);
        } else if (event.key === "Home") {
          event.preventDefault();
          options[0].focus();
        } else if (event.key === "End") {
          event.preventDefault();
          options[options.length - 1].focus();
        } else if (event.key === "Escape") {
          event.preventDefault();
          closeSelector(root, true);
        }
      });
    });
  }

  function init() {
    cacheEnglish();
    selectors.forEach(bindSelector);
    document.addEventListener("click", (event) => {
      selectors.forEach((root) => {
        if (!root.contains(event.target)) {
          closeSelector(root, false);
        }
      });
    });
    const saved = localStorage.getItem("ascii-unicode-lang") || "en";
    applyLanguage(saved, false);
  }

  window.asciiUnicodeLanguage = { applyLanguage };
  document.addEventListener("DOMContentLoaded", init);
})();
