import { CHAPTERS, beatOpacity, heroOpacity, contactOpacity } from './timeline.js';

export function createChapters(doc) {
  const items = [
    { el: doc.getElementById('hero'), fn: heroOpacity },
    ...CHAPTERS.map((c) => ({ el: doc.getElementById(`chapter-${c.id}`), fn: (p) => beatOpacity(p, c.at) })),
    { el: doc.getElementById('contact'), fn: contactOpacity },
    { el: doc.getElementById('to-top'), fn: (p) => 1 - heroOpacity(p), live: true },
  ];
  const last = new Array(items.length).fill(-1);
  return {
    update(p) {
      items.forEach((it, i) => {
        const o = it.fn(p);
        if (Math.abs(o - last[i]) < 0.002) return;
        last[i] = o;
        it.el.style.setProperty('--o', o.toFixed(3));
        if (it.live) it.el.classList.toggle('is-live', o > 0.5);
      });
    },
  };
}
