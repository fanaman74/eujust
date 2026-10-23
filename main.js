/* ============================================================
   EU JUST — interaction + motion
   ============================================================ */

(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

  const loader = document.getElementById("loader");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const latestViewport = document.getElementById("latest-viewport");
  const latestTrack = document.getElementById("latest-track");
  const latestProgress = document.querySelector(".latest__progress span");
  const latestCurrent = document.querySelector("[data-current]");

  let started = false;
  let heroStarted = false;
  let menuOpen = false;

  /* ---------- no-motion fallback ---------- */

  if (!hasGSAP || !hasScrollTrigger || prefersReduced) {
    if (loader) {
      loader.classList.remove("is-active");
      loader.style.display = "none";
    }
    body.classList.remove("is-loading");
    root.classList.add("no-js");
  }

  if (hasGSAP && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------- mobile menu ---------- */

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
    if (hasGSAP && !prefersReduced) {
      gsap.fromTo(
        mobileMenu.querySelectorAll("a, .mobile-menu__label"),
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: .35, stagger: .045, ease: "power2.out", overwrite: true }
      );
    }
  }

  document.querySelectorAll(".masthead details").forEach((details) => {
    document.addEventListener("click", (event) => {
      if (details.open && !details.contains(event.target)) details.open = false;
    });
  });

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      if (menuOpen) closeMenu();
      else openMenu();
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        document.querySelectorAll(".masthead details[open]").forEach((details) => (details.open = false));
        if (menuOpen) {
          closeMenu();
          menuToggle.focus();
        }
      }
    });

    window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
      if (event.matches) closeMenu();
    });
  }

  /* ---------- anchor scrolling with sticky-header offset ---------- */

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
      const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset);

      window.scrollTo({
        top,
        behavior: prefersReduced ? "auto" : "smooth"
      });

      if (link.classList.contains("skip-link")) {
        target.focus({ preventScroll: true });
      }

      if (history.replaceState) history.replaceState(null, "", hash);
    });
  });

  /* ---------- helpers ---------- */

  function setLatestProgress(progress) {
    const p = Math.min(1, Math.max(0, progress || 0));
    if (latestProgress) latestProgress.style.width = `${p * 100}%`;
    if (latestCurrent) {
      const current = Math.min(5, Math.max(1, Math.round(p * 4) + 1));
      latestCurrent.textContent = String(current).padStart(2, "0");
    }
  }

  function updateLatestFromScroll() {
    if (!latestViewport) return;
    const max = latestViewport.scrollWidth - latestViewport.clientWidth;
    setLatestProgress(max > 0 ? latestViewport.scrollLeft / max : 0);
  }

  if (latestViewport) {
    latestViewport.addEventListener("scroll", updateLatestFromScroll, { passive: true });
    window.addEventListener("resize", updateLatestFromScroll);
  }

  /* ---------- loader + entrance ---------- */

  function startHero() {
    if (!hasGSAP || prefersReduced || heroStarted) return;
    heroStarted = true;

    gsap.set(".hero__line-inner", { yPercent: 114 });
    gsap.set(".hero__mark-bg", { scaleX: 0 });

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    tl.to(".hero__line-inner", {
      yPercent: 0,
      duration: 1.05,
      stagger: .12
    })
      .to(".hero__mark-bg", {
        scaleX: 1,
        duration: .8,
        ease: "power4.inOut"
      }, "-=.82")
      .from(".hero__kicker > *", {
        y: 10,
        opacity: 0,
        duration: .45,
        stagger: .05
      }, 0)
      .from(".hero__lede", {
        y: 26,
        opacity: 0,
        duration: .7
      }, "-=.75")
      .from(".hero__actions > *", {
        y: 18,
        opacity: 0,
        duration: .55,
        stagger: .07
      }, "-=.55")
      .from(".hero__micro", {
        y: 12,
        opacity: 0,
        duration: .45
      }, "-=.4")
      .from(".dossier", {
        y: 58,
        opacity: 0,
        duration: .95
      }, "-=.95")
      .from(".tape--dossier", {
        scaleX: 0,
        opacity: 0,
        duration: .45
      }, "-=.55")
      .from(".seal", {
        scale: .35,
        opacity: 0,
        rotate: -32,
        duration: .6,
        ease: "back.out(1.5)"
      }, "-=.6")
      .from(".hero__source-note", {
        y: 12,
        opacity: 0,
        duration: .45
      }, "-=.55");
  }

  function runLoader() {
    const counter = { value: 0 };
    const countEl = document.querySelector(".loader__count");

    body.classList.add("is-loading");
    loader.classList.add("is-active");
    loader.style.display = "flex";

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        started = true;
        loader.classList.remove("is-active");
        loader.style.display = "none";
        body.classList.remove("is-loading");
        startHero();
        initMotion();
      }
    });

    tl.to(".loader__bar span", { scaleX: 1, duration: .78 }, 0)
      .to(counter, {
        value: 100,
        duration: .78,
        onUpdate: () => {
          if (countEl) countEl.textContent = String(Math.round(counter.value)).padStart(3, "0");
        }
      }, 0)
      .to(".loader__inner", { y: -22, opacity: 0, duration: .34, ease: "power2.in" }, "+=.12")
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: .62, ease: "expo.inOut" }, "-=.08");

    window.setTimeout(() => {
      if (!started) {
        tl.kill();
        loader.classList.remove("is-active");
        loader.style.display = "none";
        body.classList.remove("is-loading");
        started = true;
        startHero();
        initMotion();
      }
    }, 4200);
  }

  /* ---------- init motion ---------- */

  let motionInitialized = false;

  function initMotion() {
    if (motionInitialized || !hasGSAP || !hasScrollTrigger || prefersReduced) return;
    motionInitialized = true;

    initParallax();
    initReveals();
    initCounters();
    initScanLine();
    initLatestScroll();
    initTilt();
    initMagnets();
    initCursor();

    ScrollTrigger.refresh();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  }

  function initParallax() {
    gsap.to(".hero__map", {
      yPercent: 9,
      rotate: -2.2,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.to(".hero__visual", {
      y: -34,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.to(".latest__bgword", {
      xPercent: -8,
      ease: "none",
      scrollTrigger: {
        trigger: ".latest",
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.fromTo(".colophon__lockup", { xPercent: -3 }, {
      xPercent: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".colophon",
        start: "top bottom",
        end: "bottom bottom",
        scrub: true
      }
    });
  }

  function initReveals() {
    gsap.utils.toArray(".section-title").forEach((title, index) => {
      gsap.from(title, {
        y: 42,
        opacity: 0,
        duration: .85,
        delay: index === 0 ? .05 : 0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: title,
          start: "top 88%",
          once: true
        }
      });
    });

    gsap.from(".overview__intro", {
      y: 24,
      opacity: 0,
      duration: .7,
      ease: "power3.out",
      scrollTrigger: { trigger: ".overview__head", start: "top 82%", once: true }
    });

    gsap.from(".ledger", {
      y: 38,
      opacity: 0,
      duration: .85,
      ease: "power3.out",
      scrollTrigger: { trigger: ".ledger", start: "top 86%", once: true }
    });

    gsap.from(".feed-board", {
      y: 42,
      opacity: 0,
      duration: .85,
      ease: "power3.out",
      scrollTrigger: { trigger: ".feed-board", start: "top 86%", once: true }
    });

    gsap.utils.toArray(".way-card").forEach((card, index) => {
      gsap.from(card, {
        y: 62,
        opacity: 0,
        duration: .8,
        delay: index * .08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".way-grid",
          start: "top 84%",
          once: true
        }
      });
    });

    gsap.utils.toArray(".note").forEach((note, index) => {
      gsap.from(note, {
        y: 54,
        opacity: 0,
        duration: .8,
        delay: index * .09,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".notes",
          start: "top 85%",
          once: true
        }
      });
    });

    gsap.from(".fineprint__warning", {
      y: 26,
      opacity: 0,
      duration: .65,
      ease: "power3.out",
      scrollTrigger: { trigger: ".fineprint__warning", start: "top 90%", once: true }
    });

    gsap.from(".cta__title > span", {
      y: 58,
      opacity: 0,
      duration: .95,
      stagger: .1,
      ease: "expo.out",
      scrollTrigger: { trigger: ".cta__title", start: "top 82%", once: true }
    });

    gsap.from(".cta__aside > *", {
      y: 24,
      opacity: 0,
      duration: .65,
      stagger: .08,
      ease: "power3.out",
      scrollTrigger: { trigger: ".cta__stage", start: "top 76%", once: true }
    });

    gsap.fromTo(".cta__strike path", {
      strokeDasharray: 500,
      strokeDashoffset: 500
    }, {
      strokeDashoffset: 0,
      duration: 1,
      ease: "power2.inOut",
      scrollTrigger: { trigger: ".cta__title", start: "top 70%", once: true }
    });

    gsap.from(".colophon__inner > *", {
      y: 24,
      opacity: 0,
      duration: .6,
      stagger: .08,
      ease: "power2.out",
      scrollTrigger: { trigger: ".colophon", start: "top 90%", once: true }
    });
  }

  function initCounters() {
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = Number(el.dataset.count);
      if (!Number.isFinite(target)) return;
      const value = { current: 0 };

      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => {
          gsap.to(value, {
            current: target,
            duration: 1.35,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = String(Math.round(value.current));
            }
          });
        }
      });
    });
  }

  function initScanLine() {
    const board = document.querySelector(".feed-board");
    const scan = document.querySelector(".feed-scan");
    const list = document.querySelector(".feed-list");
    const bar = document.querySelector(".feed-board__bar");
    if (!board || !scan || !list || !bar) return;

    const scanTween = gsap.timeline({
      paused: true,
      repeat: -1,
      repeatDelay: .55,
      defaults: { ease: "none" }
    });

    scanTween
      .set(scan, { y: () => bar.offsetHeight + 1, opacity: 0 })
      .to(scan, { opacity: .85, duration: .4 })
      .to(scan, {
        y: () => bar.offsetHeight + list.offsetHeight - 4,
        duration: 7.2,
        ease: "none"
      })
      .to(scan, { opacity: 0, duration: .3 });

    ScrollTrigger.create({
      trigger: board,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => scanTween.play(),
      onEnterBack: () => scanTween.play(),
      onLeave: () => scanTween.pause(),
      onLeaveBack: () => scanTween.pause()
    });

    board.addEventListener("pointerenter", () => scanTween.pause());
    board.addEventListener("pointerleave", () => scanTween.play());
    board.addEventListener("focusin", () => scanTween.pause());
    board.addEventListener("focusout", () => scanTween.play());

    window.addEventListener("resize", () => {
      scanTween.invalidate();
      scanTween.restart();
    });
  }

  function initLatestScroll() {
    if (!latestTrack || !latestViewport) return;

    gsap.from(".case-card", {
      y: 58,
      opacity: 0,
      duration: .72,
      stagger: .07,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".latest",
        start: "top 66%",
        once: true
      }
    });

    const media = gsap.matchMedia();

    media.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
      const distance = () => Math.max(0, latestTrack.scrollWidth - latestViewport.clientWidth);

      gsap.to(latestTrack, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: ".latest",
          start: "top top",
          end: () => `+=${Math.max(1, distance()) + window.innerHeight * .32}`,
          pin: ".latest__pin",
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setLatestProgress(self.progress)
        }
      });
    });

    media.add("(max-width: 900px), (prefers-reduced-motion: reduce)", () => {
      gsap.set(latestTrack, { clearProps: "transform" });
      setLatestProgress(0);
      updateLatestFromScroll();
    });

    setLatestProgress(0);
    updateLatestFromScroll();
  }

  function initTilt() {
    if (!finePointer) return;

    document.querySelectorAll("[data-tilt]").forEach((el) => {
      const baseRotation = el.classList.contains("dossier")
        ? -2.2
        : parseFloat(getComputedStyle(el).getPropertyValue("--r")) || 0;

      let rect = null;

      el.addEventListener("pointerenter", () => {
        rect = el.getBoundingClientRect();
      });

      el.addEventListener("pointermove", (event) => {
        if (!rect) rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - .5;
        const py = (event.clientY - rect.top) / rect.height - .5;

        gsap.to(el, {
          rotationY: px * 7,
          rotationX: -py * 7,
          rotation: baseRotation + px * 1.4,
          transformPerspective: 900,
          transformOrigin: "center center",
          duration: .4,
          ease: "power2.out",
          overwrite: "auto"
        });
      });

      el.addEventListener("pointerleave", () => {
        gsap.to(el, {
          rotationY: 0,
          rotationX: 0,
          rotation: baseRotation,
          duration: .55,
          ease: "power2.out",
          overwrite: "auto"
        });
      });
    });
  }

  function initMagnets() {
    if (!finePointer) return;

    document.querySelectorAll(".magnet").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: .35, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: .35, ease: "power3.out" });

      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - .5;
        const py = (event.clientY - rect.top) / rect.height - .5;
        xTo(px * 8);
        yTo(py * 6);
      });

      el.addEventListener("pointerleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  function initCursor() {
    if (!finePointer) return;

    const cursor = document.querySelector(".cursor");
    const dot = document.querySelector(".cursor__dot");
    const ring = document.querySelector(".cursor__ring");
    const label = document.querySelector(".cursor__label");
    if (!cursor || !dot || !ring || !label) return;

    body.classList.add("has-cursor");

    gsap.set([dot, ring, label], { xPercent: -50, yPercent: -50, opacity: 0 });

    const dotX = gsap.quickTo(dot, "x", { duration: .08, ease: "power2.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: .08, ease: "power2.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: .32, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: .32, ease: "power3.out" });
    const labelX = gsap.quickTo(label, "x", { duration: .32, ease: "power3.out" });
    const labelY = gsap.quickTo(label, "y", { duration: .32, ease: "power3.out" });

    let visible = false;

    window.addEventListener("pointermove", (event) => {
      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { opacity: 1, duration: .2 });
      }
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
      labelX(event.clientX + 22);
      labelY(event.clientY + 20);
    });

    document.addEventListener("pointerleave", () => {
      visible = false;
      gsap.to([dot, ring, label], { opacity: 0, duration: .2 });
    });

    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("pointerenter", () => {
        cursor.classList.add("is-link");
        if (el.getAttribute("target") === "_blank") label.textContent = "Source";
        else if (el.matches(".way-card")) label.textContent = "Open file";
        else label.textContent = "Open";
      });
      el.addEventListener("pointerleave", () => {
        cursor.classList.remove("is-link");
      });
    });
  }

  /* ---------- boot ---------- */

  if (hasGSAP && hasScrollTrigger && !prefersReduced) {
    gsap.set(".hero__line-inner", { yPercent: 114 });
    gsap.set(".hero__mark-bg", { scaleX: 0 });
    runLoader();
  } else {
    if (loader) {
      loader.style.display = "none";
      loader.classList.remove("is-active");
    }
    body.classList.remove("is-loading");
    updateLatestFromScroll();
  }
})();
