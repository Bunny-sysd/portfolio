import { decodeText } from './decode.js';
import { sha256Hex } from './sigil.js';
import { liveStage } from './live-state.js';

// "How it works": a project's architecture as a holographic schematic.
// Each stage is a node drawn as a small reactor — a rotating dashed orbit,
// a tick ring, a progress arc that fills while the stage is live, and a
// hexagonal core — joined by curved conduits that carry packets toward the
// next stage. Under it, a segmented stage timer, the stage name decoding in,
// and a signature: the real SHA-256 of the stage name (identity, as with the
// project sigils). It steps on its own; a click or focus pins a stage.
// Under reduced motion nothing moves by itself, and clicking still works.
const STEP_MS = 3200;
const NS = 'http://www.w3.org/2000/svg';
const el = (doc, tag, attrs = {}) => {
  const n = doc.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

function reactor(doc) {
  const svg = el(doc, 'svg', { viewBox: '-40 -40 80 80', class: 'flow__reactor', 'aria-hidden': 'true' });
  svg.append(
    el(doc, 'circle', { r: 36, class: 'r-halo' }),
    el(doc, 'circle', { r: 33, class: 'r-orbit' }),
  );
  const ticks = el(doc, 'g', { class: 'r-ticks' });
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2, long = i % 9 === 0;
    ticks.append(el(doc, 'line', {
      x1: Math.cos(a) * (long ? 24 : 26), y1: Math.sin(a) * (long ? 24 : 26),
      x2: Math.cos(a) * 28.5, y2: Math.sin(a) * 28.5,
    }));
  }
  svg.append(ticks);
  // Progress arc: pathLength 100 so dashoffset maps straight to percent.
  svg.append(el(doc, 'circle', { r: 21, class: 'r-track' }), el(doc, 'circle', { r: 21, class: 'r-arc', pathLength: 100, transform: 'rotate(-90)' }));
  const hex = [...Array(6)].map((_, i) => { const a = Math.PI / 6 + (i * Math.PI) / 3; return `${(Math.cos(a) * 15).toFixed(2)},${(Math.sin(a) * 15).toFixed(2)}`; }).join(' ');
  svg.append(el(doc, 'polygon', { points: hex, class: 'r-core' }), el(doc, 'circle', { r: 36, class: 'r-ping' }));
  return svg;
}

function conduit(doc, i) {
  // A gentle S-curve, bowing alternately up and down.
  const bow = i % 2 ? 9 : -9;
  const d = `M0,20 C30,${20 + bow} 70,${20 - bow} 100,20`;
  const svg = el(doc, 'svg', { viewBox: '0 0 100 40', preserveAspectRatio: 'none', class: 'flow__wire', 'aria-hidden': 'true' });
  svg.append(
    el(doc, 'path', { d, class: 'w-base', 'vector-effect': 'non-scaling-stroke' }),
    el(doc, 'path', { d, class: 'w-lit', pathLength: 100, 'vector-effect': 'non-scaling-stroke' }),
    el(doc, 'path', { d, class: 'w-packets', pathLength: 100, 'vector-effect': 'non-scaling-stroke' }),
  );
  return svg;
}

export function renderFlow(root, steps, { reduced, id }) {
  const list = root.querySelector('.flow__nodes');
  const desc = root.querySelector('.flow__desc');
  const tag = root.querySelector('.flow__tag');
  const sig = root.querySelector('.flow__sig');
  const bar = root.querySelector('.flow__timer');
  const doc = root.ownerDocument;
  root.hidden = !steps?.length;
  if (!steps?.length) return () => {};
  root.style.setProperty('--n', steps.length);
  root.style.setProperty('--step', `${STEP_MS}ms`);

  const nodes = steps.map(([label], i) => {
    const li = doc.createElement('li');
    li.style.setProperty('--i', i);
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'flow__node';
    b.setAttribute('aria-pressed', 'false');
    const r = reactor(doc);
    const num = doc.createElement('span');
    num.className = 'flow__num';
    num.textContent = String(i + 1).padStart(2, '0');
    const name = doc.createElement('span');
    name.className = 'flow__label';
    name.textContent = label;
    b.append(r, num, name);
    li.append(b);
    if (i < steps.length - 1) li.append(conduit(doc, i));
    return { li, b };
  });
  list.replaceChildren(...nodes.map((n) => n.li));
  bar.replaceChildren(...steps.map(() => doc.createElement('i')));

  let active = 0, timer = 0, pinned = false, token = 0;
  const show = (i) => {
    active = i;
    Object.assign(liveStage, { id, index: i, t0: performance.now(), pinned });
    nodes.forEach(({ li, b }, k) => {
      b.setAttribute('aria-pressed', String(k === i));
      li.classList.toggle('is-done', k < i);
      li.classList.toggle('is-active', k === i);
    });
    [...bar.children].forEach((seg, k) => { seg.className = k < i ? 'is-done' : k === i ? (pinned ? 'is-done' : 'is-live') : ''; });
    // Restart the live segment's fill and the active node's arc.
    root.classList.remove('is-ticking'); void root.offsetWidth; if (!pinned) root.classList.add('is-ticking');
    tag.textContent = `${String(i + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')} · ${steps[i][0]}`;
    desc.textContent = steps[i][1];
    decodeText([tag], { reduced: reduced(), duration: 420 });
    desc.classList.remove('is-in'); void desc.offsetWidth; desc.classList.add('is-in');
    const my = ++token;
    sig.textContent = 'sig ········';
    sha256Hex(steps[i][0]).then((hex) => { if (my === token && hex) sig.textContent = `sig ${hex.slice(0, 16)}`; });
  };
  nodes.forEach(({ b }, i) => {
    const pin = () => { pinned = true; clearInterval(timer); root.classList.add('is-pinned'); show(i); };
    b.addEventListener('click', pin);
    b.addEventListener('focus', pin);
  });
  root.classList.remove('is-pinned');
  show(0);
  root.classList.remove('is-in'); void root.offsetWidth; root.classList.add('is-in');
  if (!reduced()) timer = setInterval(() => { if (!pinned) show((active + 1) % steps.length); }, STEP_MS);
  return () => clearInterval(timer);
}
