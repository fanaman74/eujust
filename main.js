(() => {
  "use strict";

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const prefersReduced = motion.matches;
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  let menuOpen = false;

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

    window.matchMedia("(min-width: 1051px)").addEventListener("change", (event) => {
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
      const offset = (header ? header.offsetHeight : 0) + 24;
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

  const marqueeToggle = document.querySelector(".ticker__toggle");
  if (marqueeToggle) {
    marqueeToggle.hidden = false;
    marqueeToggle.addEventListener("click", () => {
      const paused = marqueeToggle.getAttribute("aria-pressed") === "true";
      marqueeToggle.setAttribute("aria-pressed", String(!paused));
    });
  }

  const viewport = document.querySelector("#latest-viewport");
  const controls = document.querySelector(".latest__controls");
  const progress = document.querySelector(".latest__progress span");

  if (viewport && controls) {
    const buttons = [...controls.querySelectorAll("button")];
    const updateRail = () => {
      const max = viewport.scrollWidth - viewport.clientWidth;
      buttons[0].disabled = viewport.scrollLeft <= 1;
      buttons[1].disabled = viewport.scrollLeft >= max - 1;
      if (progress) progress.style.width = max > 0 ? `${100 * viewport.scrollLeft / max}%` : "100%";
    };
    for (const button of buttons) {
      button.addEventListener("click", () => {
        const [first, second] = viewport.querySelectorAll(".case-card");
        if (!second) return;
        viewport.scrollBy({
          left: Number(button.dataset.railStep) * (second.offsetLeft - first.offsetLeft),
          behavior: motion.matches ? "instant" : "smooth"
        });
      });
    }
    controls.hidden = false;
    viewport.addEventListener("scroll", updateRail, { passive: true });
    new ResizeObserver(updateRail).observe(viewport);
    updateRail();
  }

  const cursor = document.querySelector(".cursor");
  if (cursor && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let frame = 0;
    let visible = false;
    function follow() {
      x += (targetX - x) * .2;
      y += (targetY - y) * .2;
      cursor.style.translate = `${x}px ${y}px`;
      frame = Math.hypot(targetX - x, targetY - y) > .2 ? requestAnimationFrame(follow) : 0;
    }
    function hideCursor() {
      visible = false;
      cursor.classList.remove("is-visible");
      cancelAnimationFrame(frame);
      frame = 0;
    }
    document.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || motion.matches) return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!visible) {
        x = targetX;
        y = targetY;
        visible = true;
      }
      cursor.classList.add("is-visible");
      cursor.classList.toggle("is-link", Boolean(event.target.closest("a, button")));
      if (!frame) frame = requestAnimationFrame(follow);
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", hideCursor);
    window.addEventListener("blur", hideCursor);
    motion.addEventListener("change", hideCursor);
  }
})();
