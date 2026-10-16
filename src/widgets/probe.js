import { toIPv4 } from '../hilbert.js';

// The cursor as a probe. The screen is read as the IPv4 address space laid
// out on a Hilbert curve (as census maps do), so the readout shows the real
// address under the pointer. Over anything you can act on, the reticle locks
// to its bounds and runs a zero-trust handshake — every target is verified,
// nothing is trusted by position. Fine pointers only; the native cursor stays.
const TARGETS = 'a, button, input, textarea, [tabindex="0"]';

export function createProbe(doc, { reduced }) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const el = doc.createElement('div');
  el.className = 'probe';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="probe__ring"><i></i><i></i><i></i><i></i></span><span class="probe__read"></span>';
  doc.body.append(el);
  const ring = el.firstElementChild, read = el.lastElementChild;
  const root = doc.documentElement;

  const pos = { x: -100, y: -100, tx: -100, ty: -100, w: 22, h: 22, tw: 22, th: 22 };
  let lock = null, lockAt = 0, raf = 0, lastText = '';

  const setText = (t) => { if (t !== lastText) { read.textContent = t; lastText = t; } };
  function tick(now) {
    raf = 0;
    if (lock && !lock.isConnected) lock = null;
    if (lock) {
      const r = lock.getBoundingClientRect();
      pos.tx = r.left + r.width / 2; pos.ty = r.top + r.height / 2;
      pos.tw = r.width + 12; pos.th = r.height + 10;
    } else { pos.tw = pos.th = root.classList.contains('is-pointing') ? 34 : 22; }
    const k = reduced() ? 1 : 0.28;
    let moving = false;
    for (const [a, b] of [['x', 'tx'], ['y', 'ty'], ['w', 'tw'], ['h', 'th']]) {
      pos[a] += (pos[b] - pos[a]) * k;
      if (Math.abs(pos[b] - pos[a]) > 0.3) moving = true; else pos[a] = pos[b];
    }
    ring.style.transform = `translate(${pos.x - pos.w / 2}px, ${pos.y - pos.h / 2}px)`;
    ring.style.width = `${pos.w}px`; ring.style.height = `${pos.h}px`;
    read.style.transform = `translate(${pos.x + pos.w / 2 + 8}px, ${pos.y - pos.h / 2 - 2}px)`;
    if (lock) {
      // AUTH for a beat, then VERIFIED — decorative, but it's the model:
      // re-check on every approach.
      const done = now - lockAt > 260;
      setText(done ? '✓ verified' : 'auth…');
      el.classList.toggle('is-verified', done);
      if (!done) moving = true;
    } else if (root.classList.contains('is-pointing')) {
      setText('▸ open');
    } else {
      setText(`${toIPv4(pos.tx / innerWidth, pos.ty / innerHeight)}/32`);
    }
    if (moving) raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  const enable = () => root.classList.toggle('has-probe', fine.matches);
  enable();
  fine.addEventListener?.('change', enable);
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pos.tx = e.clientX; pos.ty = e.clientY;
    const t = e.target.closest?.(TARGETS);
    if (t !== lock) {
      lock = t && !t.closest('dialog, .term__out') ? t : null;
      lockAt = performance.now();
      el.classList.remove('is-verified');
      el.classList.toggle('is-locked', !!lock);
    }
    el.classList.add('is-live');
    kick();
  }, { passive: true });
  doc.addEventListener('pointerleave', () => el.classList.remove('is-live'));
  addEventListener('scroll', kick, { passive: true, capture: true });
  return { el };
}
