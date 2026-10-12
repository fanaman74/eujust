const section = document.querySelector<HTMLElement>('.latest-courts');
const grid = section?.querySelector<HTMLElement>('.court-card-grid');
const pause = section?.querySelector<HTMLButtonElement>('.latest-motion');
const replay = section?.querySelector<HTMLButtonElement>('.latest-replay');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let played = false;
let inView = false;
let replayFrame = 0;
const highlight = () => {
  if (!section || !grid || preference.matches || section.dataset.motion === 'paused') return;
  cancelAnimationFrame(replayFrame);
  grid.style.setProperty('--scan-distance', `${grid.offsetHeight}px`);
  grid.querySelectorAll<HTMLElement>('.court-card').forEach((card) => card.style.setProperty('--card-delay', `${Math.min(2200, (card.offsetTop / Math.max(1, grid.offsetHeight)) * 2400)}ms`));
  section.classList.remove('latest-scan');
  replayFrame = requestAnimationFrame(() => { replayFrame = requestAnimationFrame(() => section.classList.add('latest-scan')); });
  played = true;
};
const syncVisibility = () => {
  if (!section) return;
  section.dataset.visibility = document.hidden || !inView ? 'hidden' : 'visible';
  if (inView && !document.hidden && !played) highlight();
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
  if (preference.matches) { cancelAnimationFrame(replayFrame); section?.classList.remove('latest-scan'); }
});
if (section) {
  section.dataset.visibility = 'hidden';
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncVisibility(); }, { threshold: 0 }).observe(section);
  document.addEventListener('visibilitychange', syncVisibility);
}
