const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_#*';

// Titles "decode" in: each character cycles through random glyphs and locks,
// left to right. Screen readers get the real text the whole time (a hidden
// copy), and the scramble itself is aria-hidden. Only plain-text elements are
// touched. `delay` holds the full scramble before letters start locking (so
// it can play while the element is still animating in). Returns a stop function that snaps straight to the final text.
// Skipped entirely under reduced motion.
export function decodeText(els, { duration = 900, delay = 0, reduced = false } = {}) {
  const runs = [];
  for (const el of els) {
    if (reduced || el.children.length) continue;
    const text = el.dataset.decodeText ?? el.textContent;
    el.dataset.decodeText = text;
    // Proportional faces change width per glyph: hold the box's height so a
    // wider scramble can't push the layout around while it runs.
    el.style.minHeight = `${el.getBoundingClientRect().height}px`;
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    el.replaceChildren(sr, vis);
    // Each character locks at its own time, staggered left to right with a little jitter.
    const lockAt = [...text].map((_, i) => delay + (i / Math.max(1, text.length)) * duration * 0.75 + Math.random() * duration * 0.25);
    runs.push({ el, text, vis, lockAt });
  }
  if (!runs.length) return () => {};
  const t0 = performance.now();
  let raf = 0, lastTick = -1;
  const finish = () => { cancelAnimationFrame(raf); for (const r of runs) { r.el.textContent = r.text; r.el.style.minHeight = ''; } };
  const tick = (now) => {
    const t = now - t0;
    // ~30 glyph changes a second reads as a scramble; every frame is just noise.
    const step = Math.floor(t / 33);
    if (step !== lastTick) {
      lastTick = step;
      for (const r of runs) {
        r.vis.textContent = [...r.text].map((ch, i) => (ch === ' ' || t >= r.lockAt[i] ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
      }
    }
    if (t < delay + duration) raf = requestAnimationFrame(tick); else finish();
  };
  raf = requestAnimationFrame(tick);
  return finish;
}
