export {};

const feed = document.querySelector<HTMLElement>('.topic-feed');
const viewport = feed?.querySelector<HTMLElement>('.topic-feed-viewport');
const list = feed?.querySelector<HTMLOListElement>('.topic-feed-list');
const controls = feed?.querySelector<HTMLElement>('.topic-feed-controls');
const pause = feed?.querySelector<HTMLButtonElement>('.topic-feed-pause');
const next = feed?.querySelector<HTMLButtonElement>('.topic-feed-next');

if (feed && viewport && list && list.children.length) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let timer: ReturnType<typeof setInterval> | undefined;
  let animation: Animation | undefined;
  let rowHeight = 0;
  let paused = false;
  let hovering = false;
  let inView = false;
  const rows = () => [...list.children] as HTMLElement[];
  const accessibleRows = () => rows().forEach((row, index) => {
    row.inert = index >= 3;
    if (index >= 3) row.setAttribute('aria-hidden', 'true');
    else row.removeAttribute('aria-hidden');
  });
  const cancelSlide = () => { animation?.cancel(); animation = undefined; };
  const advance = (animated: boolean) => {
    if (animation || list.children.length <= 3) return;
    const first = list.firstElementChild!;
    const commit = () => { list.append(first); accessibleRows(); };
    if (!animated) { commit(); return; }
    const slide = list.animate([{ transform: 'translateY(0)' }, { transform: `translateY(-${rowHeight}px)` }], {
      duration: 500, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'forwards'
    });
    animation = slide;
    slide.finished.then(() => {
      if (animation !== slide) return;
      commit(); slide.cancel(); animation = undefined;
    }).catch(() => { /* Pausing, resizing or hiding restores the current three rows. */ });
  };
  const sync = () => {
    const active = !paused && !hovering && !feed.contains(document.activeElement) && !document.hidden && inView && !preference.matches && list.children.length > 3;
    if (active && !timer) timer = setInterval(() => advance(true), 5000);
    if (!active) { clearInterval(timer); timer = undefined; cancelSlide(); }
    if (pause) pause.hidden = preference.matches;
  };
  const measure = () => {
    cancelSlide();
    feed.removeAttribute('data-enhanced');
    rowHeight = Math.ceil(Math.max(...rows().map((row) => row.getBoundingClientRect().height)));
    feed.style.setProperty('--feed-row-height', `${rowHeight}px`);
    feed.style.setProperty('--feed-viewport-height', `${rowHeight * Math.min(3, list.children.length)}px`);
    feed.dataset.enhanced = 'true';
    accessibleRows();
  };
  measure();
  if (controls) controls.hidden = list.children.length <= 3;
  pause?.addEventListener('click', () => {
    paused = !paused;
    pause.setAttribute('aria-pressed', String(paused));
    const label = paused ? 'Play feed' : 'Pause feed';
    pause.setAttribute('aria-label', label);
    pause.title = label;
    pause.querySelector<HTMLElement>('[data-play-icon]')!.hidden = !paused;
    pause.querySelector<HTMLElement>('[data-pause-icon]')!.hidden = paused;
    sync();
  });
  next?.addEventListener('click', () => { cancelSlide(); advance(false); sync(); });
  feed.addEventListener('mouseenter', () => { hovering = true; sync(); });
  feed.addEventListener('mouseleave', () => { hovering = false; sync(); });
  feed.addEventListener('focusin', sync);
  feed.addEventListener('focusout', () => queueMicrotask(sync));
  document.addEventListener('visibilitychange', sync);
  preference.addEventListener('change', sync);
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { threshold: .1 }).observe(viewport);
  let width = viewport.getBoundingClientRect().width;
  new ResizeObserver(() => {
    const current = viewport.getBoundingClientRect().width;
    if (current !== width) { width = current; measure(); sync(); }
  }).observe(viewport);
  document.fonts.ready.then(() => { measure(); sync(); });
  sync();
}
