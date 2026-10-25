import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const preference = matchMedia('(prefers-reduced-motion: reduce)');
const sections = gsap.utils.toArray<HTMLElement>(
  'main > .home-feed, main > .collection-overview, main > .home-services, main > .latest-courts, main > .home-method'
);

if (!preference.matches) {
  sections.forEach((section) => {
    gsap.fromTo(section,
      { autoAlpha: 0, y: 28 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.75,
        ease: 'power2.out',
        clearProps: 'opacity,visibility,transform',
        scrollTrigger: {
          trigger: section,
          start: 'top 88%',
          once: true
        }
      }
    );
  });
}
