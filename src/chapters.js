import { CHAPTERS, beatOpacity, heroOpacity, contactOpacity } from './timeline.js';

// Drives each beat's opacity (`--o`) from scroll progress. Every item also gets
// `is-live` while it's more than half visible: CSS uses it to keep faded beats
// from catching pointer events and to keep the overview link out of the tab
// order until it shows. Focus landing inside a beat that isn't on screen
// (keyboard Tab, screen-reader navigation) scrolls the film to that beat, so
// a focused control is never invisible.
export function createChapters(doc, { scroll }) {
  const items = [
    { el: doc.getElementById('hero'), fn: heroOpacity, at: 0 },
    ...CHAPTERS.map((c) => ({ el: doc.getElementById(`chapter-${c.id}`), fn: (p) => beatOpacity(p, c.at), at: c.at })),
    { el: doc.getElementById('contact'), fn: contactOpacity, at: 1 },
    { el: doc.getElementById('to-top'), fn: (p) => 1 - heroOpacity(p) },
  ];
  const last = new Array(items.length).fill(-1);
  items.forEach((it, i) => {
    if (it.at === undefined) return;
    // Keyboard focus only (:focus-visible): a mouse click on a beat that is
    // still fading in must reach its button, not re-aim the scroll.
    it.el.addEventListener('focusin', (e) => {
      if (!(last[i] > 0.9) && e.target.matches(':focus-visible')) scroll.scrollToProgress(it.at);
    });
  });
  return {
    update(p) {
      items.forEach((it, i) => {
        const o = it.fn(p);
        if (Math.abs(o - last[i]) < 0.002) return;
        last[i] = o;
        it.el.style.setProperty('--o', o.toFixed(3));
        it.el.classList.toggle('is-live', o > 0.5);
      });
    },
  };
}
