const section = document.querySelector<HTMLElement>('.latest-courts');
const grid = section?.querySelector<HTMLElement>('.court-card-grid');
const pause = section?.querySelector<HTMLButtonElement>('.latest-motion');
const replay = section?.querySelector<HTMLButtonElement>('.latest-replay');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let played = false;
let inView = false;
let cardsInView = false;
let replayFrame = 0;
const highlight = () => {
  if (!section || !grid || preference.matches || section.dataset.motion === 'paused') return;
  cancelAnimationFrame(replayFrame);
  const bounds = section.getBoundingClientRect();
  const height = Math.max(1, bounds.height);
  const duration = Math.max(2.4, Math.min(6.5, height / 360));
  section.style.setProperty('--scan-distance', `${height}px`);
  section.style.setProperty('--scan-duration', `${duration.toFixed(2)}s`);
  grid.querySelectorAll<HTMLElement>('.court-card').forEach((card) => card.style.setProperty('--card-delay', `${(Math.max(0, card.getBoundingClientRect().top - bounds.top + 30) / height * duration).toFixed(2)}s`));
  grid.querySelectorAll<HTMLElement>('.court-card-content').forEach((content) => {
    const rect = content.getBoundingClientRect();
    content.style.setProperty('--text-delay', `${Math.max(0, rect.top - bounds.top) / height * duration}s`);
    content.style.setProperty('--text-duration', `${Math.max(.1, rect.height / height * duration)}s`);
  });
  section.classList.add('latest-prepared');
  section.classList.remove('latest-scan');
  replayFrame = requestAnimationFrame(() => { replayFrame = requestAnimationFrame(() => section.classList.add('latest-scan')); });
  played = true;
};
const syncVisibility = () => {
  if (!section) return;
  section.dataset.visibility = document.hidden || !inView ? 'hidden' : 'visible';
  if (cardsInView && !document.hidden && !played) highlight();
};
pause?.addEventListener('click', () => {
  const paused = pause.getAttribute('aria-pressed') !== 'true';
  pause.setAttribute('aria-pressed', String(paused));
  pause.textContent = paused ? 'Play section animation' : 'Pause section animation';
  if (section) section.dataset.motion = paused ? 'paused' : 'playing';
  if (replay) replay.disabled = paused;
  if (!paused) syncVisibility();
});
replay?.addEventListener('click', highlight);
preference.addEventListener('change', () => {
  if (preference.matches) { cancelAnimationFrame(replayFrame); section?.classList.remove('latest-scan', 'latest-prepared'); }
  else syncVisibility();
});
if (section) {
  section.dataset.visibility = 'hidden';
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncVisibility(); }, { threshold: 0 }).observe(section);
  if (grid) {
    // Keep the reference's 30% grid entrance reachable for tall mobile grids.
    let entrance: IntersectionObserver;
    const observeCards = () => {
      entrance?.disconnect();
      const threshold = Math.min(.3, innerHeight * .3 / Math.max(1, grid.offsetHeight));
      entrance = new IntersectionObserver(([entry]) => {
        cardsInView = entry.isIntersecting && entry.intersectionRatio >= threshold;
        syncVisibility();
      }, { threshold });
      entrance.observe(grid);
    };
    observeCards();
    new ResizeObserver(observeCards).observe(grid);
  }
  document.addEventListener('visibilitychange', syncVisibility);
  if (grid && !preference.matches) section.classList.add('latest-prepared');
}
