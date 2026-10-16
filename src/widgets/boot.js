import { decodeText } from './decode.js';

const GLYPHS = '0123456789abcdef';
const HOLD_MS = 900; // "channel secure" stays this long before fading
// A handshake, stylised: the steps a TLS 1.3 connection walks through. It's
// the boot readout's script while the shaders compile — decorative
// (aria-hidden), not a report on this page's actual connection.
const STEPS = ['client hello', 'server hello', 'key share', 'verify', 'finished'];

// A small boot line, bottom-centre, while the scene's shaders compile: the
// handshake steps tick over with a scrambling key fingerprint, then decode to
// CHANNEL SECURE on the first rendered frame and fade. Never covers content —
// the hero is readable before any of this runs. Under reduced motion the
// text is static and simply fades.
export function createBootReadout(parent, { reduced = false } = {}) {
  const el = document.createElement('p');
  el.className = 'boot';
  el.setAttribute('aria-hidden', 'true');
  const steps = document.createElement('span');
  steps.className = 'boot__steps';
  const dots = STEPS.map((s) => Object.assign(document.createElement('i'), { title: s }));
  steps.append(...dots);
  const label = document.createElement('span');
  label.textContent = STEPS[0];
  const code = document.createElement('span');
  code.className = 'boot__code';
  code.textContent = '········';
  el.append(steps, label, code);
  parent.append(el);
  let n = 0;
  const show = (i) => { dots.forEach((d, k) => d.classList.toggle('is-on', k <= i)); label.textContent = STEPS[i]; };
  show(0);
  let timer = reduced ? 0 : setInterval(() => {
    n++;
    if (n % 4 === 0) show(Math.min(STEPS.length - 2, n / 4));
    code.textContent = Array.from({ length: 8 }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
  }, 50);
  return {
    done() {
      clearInterval(timer);
      show(STEPS.length - 1);
      label.textContent = '';
      code.textContent = 'Channel secure';
      decodeText([code], { reduced, duration: 500 });
      setTimeout(() => {
        el.classList.add('is-done');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
        if (reduced) el.remove();
      }, reduced ? 0 : HOLD_MS);
    },
  };
}
