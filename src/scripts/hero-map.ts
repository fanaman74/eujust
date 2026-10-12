export {};

const hero = document.querySelector<HTMLElement>('.home-hero');
const video = hero?.querySelector<HTMLVideoElement>('.hero-map-video');
const button = hero?.querySelector<HTMLButtonElement>('.hero-motion');
const fullscreen = hero?.querySelector<HTMLButtonElement>('.hero-fullscreen');

if (hero && video && button) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-width: 700px)');
  const saveData = (navigator as Navigator & {connection?: {saveData?: boolean}}).connection?.saveData;
  let wantsPlaying = !preference.matches && !saveData;
  let inView = true;
  let internalPause = false;
  const setIcon = () => {
    const label = wantsPlaying ? 'Pause map animation' : 'Play map animation';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.setAttribute('aria-pressed', String(!wantsPlaying));
    button.querySelector<HTMLElement>('[data-play-icon]')!.hidden = wantsPlaying;
    button.querySelector<HTMLElement>('[data-pause-icon]')!.hidden = !wantsPlaying;
  };
  const source = () => {
    const path = portrait.matches ? video.dataset.portrait! : video.dataset.landscape!;
    video.poster = portrait.matches ? '/videos/europe-portrait-poster.png' : '/videos/europe-landscape-poster.png';
    if (video.getAttribute('src') !== path) { video.dataset.ready = 'false'; video.src = path; video.load(); }
  };
  const sync = () => {
    setIcon();
    if (wantsPlaying && !document.hidden && (inView || document.fullscreenElement === video)) {
      source();
      video.muted = true;
      video.play().catch((error: Error) => {
        if (error.name !== 'AbortError') { wantsPlaying = false; setIcon(); }
      });
    } else { internalPause = !video.paused; video.pause(); }
  };
  video.addEventListener('loadeddata', () => { video.dataset.ready = 'true'; });
  video.addEventListener('error', () => { wantsPlaying = false; video.dataset.ready = 'false'; setIcon(); });
  video.addEventListener('pause', () => {
    if (internalPause) { internalPause = false; return; }
    if (document.fullscreenElement === video) { wantsPlaying = false; setIcon(); }
  });
  video.addEventListener('play', () => {
    if (document.fullscreenElement === video) { wantsPlaying = true; setIcon(); }
  });
  button.addEventListener('click', () => { wantsPlaying = !wantsPlaying; sync(); });
  preference.addEventListener('change', () => { wantsPlaying = !preference.matches; sync(); });
  portrait.addEventListener('change', () => { if (video.hasAttribute('src')) source(); sync(); });
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('fullscreenchange', () => {
    const active = document.fullscreenElement === video;
    video.controls = active;
    video.setAttribute('aria-hidden', String(!active));
    hero.querySelector('.hero-map-media')?.setAttribute('aria-hidden', String(!active));
    sync();
  });
  const mastheadHeight = document.querySelector('.masthead')?.getBoundingClientRect().height ?? 0;
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, {
    rootMargin: `-${Math.ceil(mastheadHeight)}px 0px 0px 0px`
  }).observe(hero);
  const safari = video as HTMLVideoElement & {webkitEnterFullscreen?: () => void};
  if (fullscreen) {
    fullscreen.hidden = !video.requestFullscreen && !safari.webkitEnterFullscreen;
    fullscreen.addEventListener('click', () => {
      wantsPlaying = true; sync();
      if (video.requestFullscreen) video.requestFullscreen().catch(() => { /* The map remains playable in the hero. */ });
      else safari.webkitEnterFullscreen?.();
    });
  }
  sync();
}
