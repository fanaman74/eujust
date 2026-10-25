/* ============================================================
   EU JUST — interior page interactions
   ============================================================ */

(() => {
  "use strict";

  const body = document.body;
  const page = body.dataset.page || "";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
  const motion = hasGSAP && hasScrollTrigger && !prefersReduced;

  if (hasGSAP && hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- menu / operations ---------- */

  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const opsMenu = document.querySelector(".ops-menu");
  let menuOpen = false;

  function closeMenu() {
    if (!menuOpen || !menuToggle || !mobileMenu) return;
    menuOpen = false;
    menuToggle.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
  }

  function openMenu() {
    if (!menuToggle || !mobileMenu) return;
    menuOpen = true;
    menuToggle.setAttribute("aria-expanded", "true");
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    if (motion) {
      gsap.fromTo(
        mobileMenu.querySelectorAll("a, .mobile-menu__label"),
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: .32, stagger: .04, ease: "power2.out", overwrite: true }
      );
    }
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));
    mobileMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  }

  document.addEventListener("click", (event) => {
    if (opsMenu && opsMenu.open && !opsMenu.contains(event.target)) opsMenu.open = false;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (opsMenu) opsMenu.open = false;
    if (menuOpen) {
      closeMenu();
      menuToggle?.focus();
    }
  });

  window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });

  /* ---------- smooth in-page anchors ---------- */

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      closeMenu();
      const header = document.querySelector(".masthead");
      const offset = (header ? header.offsetHeight : 0) + 12;
      window.scrollTo({
        top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset),
        behavior: prefersReduced ? "auto" : "smooth"
      });
      if (history.replaceState) history.replaceState(null, "", hash);
    });
  });

  /* ---------- clipboard ---------- */

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        area.remove();
      }
    });
  }

  document.querySelectorAll("[data-copy-citation]").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.getAttribute("data-copy-citation") || "";
      try {
        await copyText(text);
        document.querySelectorAll(".copy-status").forEach((status) => (status.textContent = "Citation copied"));
        window.setTimeout(() => {
          document.querySelectorAll(".copy-status").forEach((status) => (status.textContent = ""));
        }, 2400);
      } catch {
        document.querySelectorAll(".copy-status").forEach((status) => (status.textContent = "Copy unavailable"));
      }
    });
  });

  /* ---------- page entry ---------- */

  function initEntryMotion() {
    if (!motion) return;

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".breadcrumbs", { y: 12, opacity: 0, duration: .45 })
      .from(".page-hero .section-index", { y: 14, opacity: 0, duration: .45 }, "-=.25")
      .from(".page-hero h1, .case-detail-hero h1", { y: 48, opacity: 0, duration: 1.02 }, "-=.3")
      .from(".page-hero__lede, .case-detail-hero .lede", { y: 22, opacity: 0, duration: .65 }, "-=.65")
      .from(".page-stats > div", { y: 16, opacity: 0, duration: .5, stagger: .06 }, "-=.5")
      .from(".page-hero__bg, .case-detail-hero .page-hero__bg", { xPercent: 5, opacity: 0, duration: 1.2 }, 0)
      .from(".case-detail-hero__actions", { y: 15, opacity: 0, duration: .5 }, "-=.45")
      .from(".case-file-card", { y: 30, opacity: 0, duration: .8 }, "-=.7");
  }

  function initRevealBatch() {
    if (!motion) return;

    const selector = [
      ".paper-panel",
      ".decision-card",
      ".topic-card",
      ".follow-card",
      ".related-card",
      ".topic-context-panel",
      ".monitor-console",
      ".provider-form",
      ".saved-providers",
      ".settings-aside",
      ".vote-card",
      ".curation-note",
      ".run-history__head",
      ".rules-shell"
    ].join(",");

    const elements = gsap.utils.toArray(selector);
    if (!elements.length) return;

    ScrollTrigger.batch(elements, {
      start: "top 90%",
      once: true,
      onEnter: (batch) => {
        gsap.from(batch, {
          y: 30,
          opacity: 0,
          duration: .68,
          stagger: .055,
          ease: "power3.out",
          overwrite: true
        });
      }
    });

    gsap.utils.toArray(".case-index-card").forEach((card, index) => {
      if (page === "cases") return;
      if (index > 12) return;
      gsap.from(card, {
        y: 22,
        opacity: 0,
        duration: .5,
        delay: Math.min(index * .025, .25),
        ease: "power2.out",
        scrollTrigger: { trigger: card, start: "top 94%", once: true }
      });
    });
  }

  function initCounters() {
    if (!motion) return;
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = Number(el.dataset.count);
      if (!Number.isFinite(target)) return;
      const value = { current: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 92%",
        once: true,
        onEnter: () => {
          gsap.to(value, {
            current: target,
            duration: 1.15,
            ease: "power2.out",
            onUpdate: () => (el.textContent = String(Math.round(value.current)))
          });
        }
      });
    });
  }

  function initMagnetic() {
    if (!motion || !finePointer) return;
    document.querySelectorAll(".magnet").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: .32, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: .32, ease: "power3.out" });
      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        xTo(((event.clientX - rect.left) / rect.width - .5) * 7);
        yTo(((event.clientY - rect.top) / rect.height - .5) * 5);
      });
      el.addEventListener("pointerleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  function initTilt() {
    if (!motion || !finePointer) return;
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      let rect = null;
      el.addEventListener("pointerenter", () => {
        rect = el.getBoundingClientRect();
      });
      el.addEventListener("pointermove", (event) => {
        if (!rect) rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - .5;
        const py = (event.clientY - rect.top) / rect.height - .5;
        gsap.to(el, {
          rotationY: px * 5,
          rotationX: -py * 4,
          transformPerspective: 900,
          duration: .4,
          ease: "power2.out",
          overwrite: "auto"
        });
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(el, { rotationY: 0, rotationX: 0, duration: .55, ease: "power2.out", overwrite: "auto" });
      });
    });
  }

  function initCursor() {
    if (!motion || !finePointer) return;
    const cursor = document.querySelector(".cursor");
    if (!cursor) return;
    const dot = cursor.querySelector(".cursor__dot");
    const ring = cursor.querySelector(".cursor__ring");
    const label = cursor.querySelector(".cursor__label");
    if (!dot || !ring) return;

    body.classList.add("has-cursor");
    gsap.set([dot, ring, label], { xPercent: -50, yPercent: -50, opacity: 0 });
    const dotX = gsap.quickTo(dot, "x", { duration: .07 });
    const dotY = gsap.quickTo(dot, "y", { duration: .07 });
    const ringX = gsap.quickTo(ring, "x", { duration: .28 });
    const ringY = gsap.quickTo(ring, "y", { duration: .28 });
    const labelX = label ? gsap.quickTo(label, "x", { duration: .28 }) : null;
    const labelY = label ? gsap.quickTo(label, "y", { duration: .28 }) : null;
    let shown = false;

    window.addEventListener("pointermove", (event) => {
      if (!shown) {
        shown = true;
        gsap.to([dot, ring], { opacity: 1, duration: .2 });
      }
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
      if (labelX && labelY) {
        labelX(event.clientX + 22);
        labelY(event.clientY + 18);
      }
    });
    document.addEventListener("pointerleave", () => {
      shown = false;
      gsap.to([dot, ring, label], { opacity: 0, duration: .2 });
    });
    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("pointerenter", () => {
        cursor.classList.add("is-link");
        if (label) label.textContent = el.getAttribute("target") === "_blank" ? "Source" : "Open";
      });
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-link"));
    });
  }

  /* ---------- cases index ---------- */

  function initCases() {
    const form = document.getElementById("case-filter");
    if (!form) return;
    const qInput = document.getElementById("case-q");
    const topicSelect = document.getElementById("case-topic");
    const courtSelect = document.getElementById("case-court");
    const sortSelect = document.getElementById("case-sort");
    const grid = document.getElementById("case-grid");
    const cards = [...document.querySelectorAll("[data-case]")];
    const result = document.getElementById("case-result");
    const loadedNote = document.getElementById("case-loaded-note");
    const loadMore = document.getElementById("case-load-more");
    const empty = document.getElementById("case-empty");
    const reset = document.getElementById("case-reset");
    const emptyReset = document.getElementById("case-empty-reset");
    const chips = [...document.querySelectorAll("[data-topic-filter]")];
    if (!grid || !cards.length) return;

    const PAGE_SIZE = 18;
    let visibleCount = PAGE_SIZE;
    let timer = 0;

    const readState = () => ({
      q: (qInput?.value || "").trim().toLowerCase(),
      topic: topicSelect?.value || "",
      court: courtSelect?.value || "",
      sort: sortSelect?.value || "newest"
    });

    function matches(card, state) {
      const search = card.dataset.search?.toLowerCase() || "";
      if (state.q && !state.q.split(/\s+/).every((term) => search.includes(term))) return false;
      if (state.topic) {
        const topicsForCard = (card.dataset.topic || "").split(/\s+/);
        if (!topicsForCard.includes(state.topic)) return false;
      }
      if (state.court && card.dataset.court !== state.court) return false;
      return true;
    }

    function sortCards(list, sort) {
      return [...list].sort((a, b) => {
        if (sort === "name") return (a.dataset.name || "").localeCompare(b.dataset.name || "");
        const aTime = Date.parse(a.dataset.date || "");
        const bTime = Date.parse(b.dataset.date || "");
        return sort === "oldest" ? aTime - bTime : bTime - aTime;
      });
    }

    function updateUrl(state) {
      if (!history.replaceState) return;
      const params = new URLSearchParams();
      if (state.q) params.set("q", state.q);
      if (state.topic) params.set("topic", state.topic);
      if (state.court) params.set("court", state.court);
      if (state.sort && state.sort !== "newest") params.set("sort", state.sort);
      const query = params.toString();
      history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}`);
    }

    function animateCards(cardsToAnimate) {
      if (!motion) return;
      gsap.fromTo(
        cardsToAnimate,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: .35, stagger: .025, ease: "power2.out", overwrite: true }
      );
    }

    function apply({ animate = true, resetPage = true, updateHistory = true } = {}) {
      if (resetPage) visibleCount = PAGE_SIZE;
      const state = readState();
      const matched = sortCards(cards.filter((card) => matches(card, state)), state.sort);

      cards.forEach((card) => {
        card.classList.add("is-hidden");
        card.style.removeProperty("opacity");
        card.style.removeProperty("transform");
      });

      matched.slice(0, visibleCount).forEach((card) => card.classList.remove("is-hidden"));
      matched.forEach((card) => grid.appendChild(card));

      const showing = Math.min(matched.length, visibleCount);
      if (empty) empty.hidden = matched.length !== 0;
      grid.hidden = matched.length === 0;

      if (result) {
        if (!matched.length) {
          result.textContent = "No rulings match those filters.";
        } else {
          result.textContent = `Showing ${showing} of ${matched.length} ruling${matched.length === 1 ? "" : "s"}${matched.length !== cards.length ? ` (filtered from ${cards.length})` : ""}.`;
        }
      }
      if (loadedNote) {
        loadedNote.textContent = matched.length
          ? `Showing ${showing} of ${matched.length}.`
          : "Try clearing the filters.";
      }
      if (loadMore) loadMore.hidden = matched.length <= visibleCount;
      chips.forEach((chip) => {
        chip.classList.toggle("is-active", (chip.dataset.topicFilter || "") === state.topic);
      });

      if (animate) animateCards(matched.slice(Math.max(0, showing - PAGE_SIZE), showing));
      if (updateHistory) updateUrl(state);
    }

    function readUrl() {
      const params = new URLSearchParams(location.search);
      if (qInput && params.get("q")) qInput.value = params.get("q");
      if (topicSelect && params.get("topic")) topicSelect.value = params.get("topic");
      if (courtSelect && params.get("court")) courtSelect.value = params.get("court");
      if (sortSelect && params.get("sort")) sortSelect.value = params.get("sort");
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      apply({ resetPage: true });
    });

    qInput?.addEventListener("input", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => apply({ resetPage: true }), 180);
    });

    [topicSelect, courtSelect, sortSelect].forEach((input) => {
      input?.addEventListener("change", () => apply({ resetPage: true }));
    });

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        if (!topicSelect) return;
        topicSelect.value = chip.dataset.topicFilter || "";
        apply({ resetPage: true });
      });
    });

    function resetFilters() {
      form.reset();
      if (topicSelect) topicSelect.value = "";
      if (courtSelect) courtSelect.value = "";
      if (sortSelect) sortSelect.value = "newest";
      apply({ resetPage: true });
    }

    reset?.addEventListener("click", (event) => {
      event.preventDefault();
      resetFilters();
    });
    emptyReset?.addEventListener("click", resetFilters);

    loadMore?.addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      apply({ animate: true, resetPage: false });
    });

    readUrl();
    apply({ animate: false, resetPage: true, updateHistory: false });

    if (motion) {
      ScrollTrigger.refresh();
    }
  }

  /* ---------- pending cases index ---------- */

  function initPendingCases() {
    const form = document.getElementById("pending-filter");
    const list = document.getElementById("pending-list");
    if (!form || !list) return;
    const qInput = document.getElementById("pending-q");
    const topicSelect = document.getElementById("pending-topic");
    const courtSelect = document.getElementById("pending-court");
    const result = document.getElementById("pending-result");
    const count = document.getElementById("pending-count");
    const reset = document.getElementById("pending-reset");
    const entries = [...list.querySelectorAll("[data-pending-case]")];
    let timer = 0;

    const apply = ({ updateHistory = true } = {}) => {
      const q = (qInput?.value || "").trim().toLowerCase();
      const topic = topicSelect?.value || "";
      const court = courtSelect?.value || "";
      const terms = q.split(/\s+/).filter(Boolean);
      let visible = 0;
      entries.forEach((entry) => {
        const search = entry.dataset.search?.toLowerCase() || "";
        const entryTopics = (entry.dataset.topics || "").split("|");
        const matches = (!terms.length || terms.every((term) => search.includes(term)))
          && (!topic || entryTopics.includes(topic))
          && (!court || entry.dataset.court === court);
        entry.hidden = !matches;
        if (matches) visible += 1;
      });
      if (count) count.textContent = String(visible);
      if (result) result.textContent = visible
        ? `Showing ${visible} of ${entries.length} pending application${entries.length === 1 ? "" : "s"}${visible === entries.length ? "" : " (filtered)"}.`
        : "No pending cases match those filters.";
      if (updateHistory && history.replaceState) {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (topic) params.set("topic", topic);
        if (court) params.set("court", court);
        const query = params.toString();
        history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}`);
      }
    };

    const params = new URLSearchParams(location.search);
    if (qInput && params.has("q")) qInput.value = params.get("q") || "";
    if (topicSelect && params.has("topic")) topicSelect.value = params.get("topic") || "";
    if (courtSelect && params.has("court")) courtSelect.value = params.get("court") || "";
    form.addEventListener("submit", (event) => { event.preventDefault(); apply(); });
    qInput?.addEventListener("input", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => apply(), 160);
    });
    [topicSelect, courtSelect].forEach((input) => input?.addEventListener("change", () => apply()));
    reset?.addEventListener("click", (event) => {
      event.preventDefault();
      form.reset();
      apply();
    });
    apply({ updateHistory: false });
  }

  /* ---------- rules tabs ---------- */

  function initRules() {
    const shell = document.querySelector(".rules-shell");
    if (!shell) return;
    const tabs = [...shell.querySelectorAll("[role='tab']")];
    const panels = [...shell.querySelectorAll("[role='tabpanel']")];
    if (!tabs.length || !panels.length) return;

    shell.classList.add("is-enhanced");

    function activate(index, focus = false) {
      const safe = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, tabIndex) => {
        const active = tabIndex === safe;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel, panelIndex) => {
        const active = panelIndex === safe;
        panel.classList.toggle("is-active", active);
        panel.hidden = false;
      });
      if (focus) tabs[safe].focus();
      if (motion) {
        const panel = panels[safe];
        const records = panel.querySelectorAll(".rule-record");
        gsap.fromTo(panel, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .4, ease: "power2.out" });
        if (records.length) {
          gsap.fromTo(records, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .35, stagger: .025, ease: "power2.out" });
        }
      }
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(index));
      tab.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          activate(index + 1, true);
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          activate(index - 1, true);
        }
        if (event.key === "Home") {
          event.preventDefault();
          activate(0, true);
        }
        if (event.key === "End") {
          event.preventDefault();
          activate(tabs.length - 1, true);
        }
      });
    });

    activate(0);
  }

  /* ---------- discharge ---------- */

  function initDischarge() {
    if (!motion) return;
    const bars = document.querySelectorAll(".vote-bar span");
    if (!bars.length) return;
    bars.forEach((bar) => {
      const width = bar.style.getPropertyValue("--w") || "0%";
      bar.style.width = "0%";
      gsap.to(bar, {
        width,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: { trigger: bar, start: "top 92%", once: true }
      });
    });
  }

  /* ---------- monitoring ---------- */

  function initMonitoring() {
    const button = document.getElementById("monitor-run");
    const note = document.getElementById("monitor-note");
    if (!button || !note) return;

    button.addEventListener("click", () => {
      if (button.classList.contains("is-running")) return;
      const original = button.innerHTML;
      button.classList.add("is-running");
      button.innerHTML = `Scanning ${'<span class="monitor-spinner" aria-hidden="true"></span>'}`;
      note.textContent = "Running a sample check against the captured record…";
      note.classList.add("is-busy");
      if (motion) {
        gsap.fromTo(note, { opacity: .4 }, { opacity: 1, duration: .5, repeat: 2, yoyo: true });
      }
      window.setTimeout(() => {
        button.classList.remove("is-running");
        button.innerHTML = original;
        note.classList.remove("is-busy");
        note.textContent = "Sample complete — no live worker attached. The captured run is unchanged.";
        if (motion) gsap.fromTo(note, { y: 4, opacity: .4 }, { y: 0, opacity: 1, duration: .35 });
      }, 1400);
    });
  }

  /* ---------- settings ---------- */

  function initSettings() {
    const form = document.getElementById("provider-form");
    if (!form) return;
    const status = document.getElementById("provider-status");
    const key = document.getElementById("api-key");
    const reveal = document.getElementById("reveal-key");
    const test = document.getElementById("test-connection");
    const provider = document.getElementById("provider");
    const model = document.getElementById("model");
    if (!status) return;

    const messages = {
      "OpenAI / ChatGPT": "gpt-4o-mini",
      "DeepSeek": "deepseek-chat",
      "OpenRouter": "openrouter/auto",
      "Anthropic Claude": "claude-sonnet-4"
    };

    provider?.addEventListener("change", () => {
      if (model && !model.value) model.placeholder = messages[provider.value] || "Model identifier";
    });

    reveal?.addEventListener("click", () => {
      if (!key) return;
      const show = key.type === "password";
      key.type = show ? "text" : "password";
      reveal.setAttribute("aria-label", show ? "Hide API key" : "Show API key");
      reveal.innerHTML = show
        ? `<svg class="icon" aria-hidden="true"><use href="#i-close"/></svg>`
        : `<svg class="icon" aria-hidden="true"><use href="#i-eye"/></svg>`;
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      status.textContent = "Demo only — nothing was saved or sent.";
    });

    test?.addEventListener("click", () => {
      if (!key?.value.trim()) {
        status.textContent = "Add a demo value to test the field, or leave it blank.";
        key?.focus();
        return;
      }
      status.textContent = "Demo only — no provider was contacted.";
      if (motion) {
        gsap.fromTo(status, { y: 3, opacity: .4 }, { y: 0, opacity: 1, duration: .3 });
      }
    });
  }

  /* ---------- boot ---------- */

  initEntryMotion();
  initRevealBatch();
  initCounters();
  initMagnetic();
  initTilt();
  initCursor();
  initCases();
  initPendingCases();
  initRules();
  initDischarge();
  initMonitoring();
  initSettings();

  if (motion) {
    ScrollTrigger.refresh();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  }
})();
