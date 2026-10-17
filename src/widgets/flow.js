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

// A distinct core glyph per stage, chosen by what the stage is about, so no
// two nodes (and no two cards) read the same. Each returns SVG children drawn
// inside the ~±13 core; the enclosing ring/arc/orbit stay shared.
function glyph(doc, label, i) {
  const g = el(doc, 'g', { class: 'r-glyph' });
  const add = (tag, a) => g.append(el(doc, tag, a));
  const poly = (n, r, rot = 0) => [...Array(n)].map((_, k) => { const a = rot + k / n * Math.PI * 2; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');
  const L = label.toLowerCase();
  if (/scan|recon|analyz|market|prompt/.test(L)) { // radar arcs
    for (let k = 1; k <= 3; k++) add('path', { d: `M${-k * 4},0 A${k * 4},${k * 4} 0 0 1 ${k * 4},0`, class: 'g-stroke' });
    add('circle', { r: 2, cx: 0, cy: 0, class: 'g-fill' });
  } else if (/fuzz|mutat|score|signal/.test(L)) { // scattered field
    [[-7, -5], [-2, 4], [4, -6], [8, 2], [1, -1], [-6, 7], [6, 7]].forEach(([x, y], k) => add('rect', { x: x - 1.3, y: y - 1.3, width: 2.6, height: 2.6, class: k % 2 ? 'g-fill' : 'g-stroke' }));
  } else if (/compile|code|build|host|proxmox/.test(L)) { // angle brackets </>
    add('path', { d: 'M-4,-8 L-12,0 L-4,8', class: 'g-stroke' });
    add('path', { d: 'M4,-8 L12,0 L4,8', class: 'g-stroke' });
    add('line', { x1: 2, y1: -9, x2: -2, y2: 9, class: 'g-stroke' });
  } else if (/patch/.test(L)) { // a diff: a minus line above a plus
    add('line', { x1: -8, y1: -5, x2: 8, y2: -5, class: 'g-stroke g-bold' });
    add('line', { x1: -8, y1: 5, x2: 8, y2: 5, class: 'g-stroke' });
    add('line', { x1: 0, y1: 1, x2: 0, y2: 9, class: 'g-stroke' });
  } else if (/verify|proven|remember|cert|gfact/.test(L)) { // check in a ring
    add('path', { d: 'M-7,0 L-2,6 L8,-7', class: 'g-stroke g-bold' });
  } else if (/flag|captur|oscp|cpts/.test(L)) { // flag
    add('line', { x1: -7, y1: -9, x2: -7, y2: 9, class: 'g-stroke' });
    add('polygon', { points: '-7,-9 8,-5 -7,-1', class: 'g-fill' });
  } else if (/report|deliver|decide|security\+|ejpt/.test(L)) { // outbound arrow
    add('line', { x1: -9, y1: 0, x2: 7, y2: 0, class: 'g-stroke' });
    add('polygon', { points: '12,0 5,-5 5,5', class: 'g-fill' });
  } else if (/act|kali|exploit|compass/.test(L)) { // terminal caret _
    add('path', { d: 'M-9,-6 L-2,0 L-9,6', class: 'g-stroke' });
    add('line', { x1: 1, y1: 7, x2: 10, y2: 7, class: 'g-stroke' });
  } else if (/reverse|ghidra|binar/.test(L)) { // magnifier over bits
    add('circle', { cx: -2, cy: -2, r: 7, class: 'g-stroke' });
    add('line', { x1: 3, y1: 3, x2: 10, y2: 10, class: 'g-stroke g-bold' });
    add('line', { x1: -5, y1: -2, x2: 1, y2: -2, class: 'g-stroke' });
    add('line', { x1: -5, y1: 1, x2: 1, y2: 1, class: 'g-stroke' });
  } else if (/switch/.test(L)) { // switch: four ports crossing a bar
    add('line', { x1: -11, y1: 0, x2: 11, y2: 0, class: 'g-stroke g-bold' });
    [-8, -3, 3, 8].forEach((x, k) => add('line', { x1: x, y1: 0, x2: x, y2: k % 2 ? -8 : 8, class: 'g-stroke' }));
  } else if (/domain|dc\b|forest/.test(L)) { // domain: concentric hexes
    add('polygon', { points: poly(6, 11, Math.PI / 6), class: 'g-stroke' });
    add('polygon', { points: poly(6, 5, Math.PI / 6), class: 'g-fill' });
  } else if (/workstation|client/.test(L)) { // monitor on a stand
    add('rect', { x: -10, y: -9, width: 20, height: 13, rx: 1, class: 'g-stroke' });
    add('line', { x1: 0, y1: 4, x2: 0, y2: 8, class: 'g-stroke' });
    add('line', { x1: -5, y1: 9, x2: 5, y2: 9, class: 'g-stroke g-bold' });
  } else if (/network/.test(L)) { // linked nodes
    const pts = [[0, -8], [-8, 6], [8, 6]];
    pts.forEach(([x, y], k) => { if (k) add('line', { x1: pts[0][0], y1: pts[0][1], x2: x, y2: y, class: 'g-stroke' }); });
    pts.forEach(([x, y]) => add('circle', { cx: x, cy: y, r: 2.4, class: 'g-fill' }));
  } else if (/plan|memory|vault/.test(L)) { // nested squares
    add('rect', { x: -10, y: -10, width: 20, height: 20, class: 'g-stroke' });
    add('rect', { x: -4.5, y: -4.5, width: 9, height: 9, class: 'g-fill' });
  } else { // fallback: a polygon whose sides grow with the stage index
    add('polygon', { points: poly(3 + (i % 4), 11, -Math.PI / 2), class: 'g-stroke' });
    add('circle', { r: 2, cx: 0, cy: 0, class: 'g-fill' });
  }
  return g;
}

function reactor(doc, label, i) {
  const svg = el(doc, 'svg', { viewBox: '-40 -40 80 80', class: 'flow__reactor', 'aria-hidden': 'true' });
  svg.append(
    el(doc, 'circle', { r: 36, class: 'r-halo' }),
    el(doc, 'circle', { r: 33, class: 'r-orbit' }),
  );
  const ticks = el(doc, 'g', { class: 'r-ticks' });
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2, long = k % 9 === 0;
    ticks.append(el(doc, 'line', {
      x1: Math.cos(a) * (long ? 24 : 26), y1: Math.sin(a) * (long ? 24 : 26),
      x2: Math.cos(a) * 28.5, y2: Math.sin(a) * 28.5,
    }));
  }
  svg.append(ticks);
  // Progress arc: pathLength 100 so dashoffset maps straight to percent.
  svg.append(el(doc, 'circle', { r: 21, class: 'r-track' }), el(doc, 'circle', { r: 21, class: 'r-arc', pathLength: 100, transform: 'rotate(-90)' }));
  svg.append(el(doc, 'circle', { r: 16, class: 'r-core' }), glyph(doc, label, i), el(doc, 'circle', { r: 36, class: 'r-ping' }));
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

export function renderFlow(root, steps, { reduced, id, hue }) {
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
  // Tint the whole diagram to the project's own colour, so each card reads
  // distinct at a glance (hue is 0–1 like the cards' screens).
  if (hue != null) root.style.setProperty('--c', `hsl(${Math.round(hue * 360)} 85% 68%)`);
  else root.style.removeProperty('--c');

  const nodes = steps.map(([label], i) => {
    const li = doc.createElement('li');
    li.style.setProperty('--i', i);
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'flow__node';
    b.setAttribute('aria-pressed', 'false');
    const r = reactor(doc, label, i);
    const name = doc.createElement('span');
    name.className = 'flow__label';
    name.textContent = label;
    b.append(r, name);
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
