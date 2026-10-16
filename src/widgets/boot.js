import { decodeText } from './decode.js';

const GLYPHS = '0123456789ABCDEF/';
const HOLD_MS = 900; // "scene online" stays this long before fading

// A small boot line in the corner while the scene's shaders compile: a
// scrambling readout that decodes to SCENE ONLINE on the first rendered frame,
// then fades. Purely decorative (aria-hidden) and never covers content — the
// hero is readable before any of this runs. Under reduced motion the text is
// static and simply fades.
export function createBootReadout(parent, { reduced = false } = {}) {
  const el = document.createElement('p');
  el.className = 'boot';
  el.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.textContent = 'Compiling scene ';
  const code = document.createElement('span');
  code.className = 'boot__code';
  code.textContent = '////////';
  el.append(label, code);
  parent.append(el);
  let timer = reduced ? 0 : setInterval(() => {
    code.textContent = Array.from({ length: 8 }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
  }, 60);
  return {
    done() {
      clearInterval(timer);
      label.textContent = '';
      code.textContent = 'Scene online';
      decodeText([code], { reduced, duration: 500 });
      setTimeout(() => {
        el.classList.add('is-done');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
        if (reduced) el.remove();
      }, reduced ? 0 : HOLD_MS);
    },
  };
}
