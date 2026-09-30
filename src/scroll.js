import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export function createScroll({ reducedMotion }) {
  const lenis = reducedMotion() ? null : new Lenis({ lerp: 0.09, smoothWheel: true });
  const max = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const root = document.documentElement;
  return {
    raf(ms) { if (lenis) lenis.raf(ms); },
    progress() { return Math.min(1, Math.max(0, scrollY / max())); },
    stop() { if (lenis) lenis.stop(); root.classList.add('scroll-locked'); },
    start() { if (lenis) lenis.start(); root.classList.remove('scroll-locked'); },
    scrollToProgress(p) {
      const y = p * max();
      if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo(0, y);
    },
  };
}
