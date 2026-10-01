import * as THREE from 'three';
import './styles/base.css';
import './styles/chapters.css';
import './styles/case-study.css';
import { createScroll } from './scroll.js';
import { createChapters } from './chapters.js';
import { initCaseStudies } from './case-study.js';
import { buildMailto } from './contact.js';
import { createStage } from './scene/stage.js';
import { createCameraRig } from './scene/camera.js';
import { createVolume, mistAt } from './scene/volume.js';
import { createPost } from './scene/post.js';
import { altitudeAt, paletteAt } from './timeline.js';

const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => reduceQuery.matches;
const WHITE = new THREE.Color(1, 1, 1);
const mistColor = new THREE.Color();

const root = document.documentElement;
const scroll = createScroll({ reducedMotion });
const chapters = createChapters(document, { scroll });
initCaseStudies({ scroll });

document.getElementById('to-top').addEventListener('click', (e) => {
  e.preventDefault();
  scroll.scrollToProgress(0);
});

const form = document.getElementById('contact-form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const note = form.querySelector('.form-note');
  const message = form.elements.message.value;
  if (!message.trim()) { note.textContent = 'Add a message first.'; return; }
  window.location.href = buildMailto(form.elements.name.value, message);
  note.textContent = 'Opening your email app with the message filled in…';
});

const canvas = document.getElementById('scene');
const stage = createStage(canvas);
if (!stage) root.classList.add('no-webgl');
const rig = stage && createCameraRig(stage.camera, { reducedMotion });
const volume = stage && createVolume(stage.scene, { tier: stage.tier, reducedMotion });
const mistEl = document.querySelector('.mist');
let lastMist = '';
let post = stage && stage.settings.postFX ? createPost(stage.renderer, stage.scene, stage.camera, { reducedMotion }) : null;

addEventListener('resize', () => {
  if (!stage) return;
  stage.camera.aspect = innerWidth / innerHeight;
  stage.camera.fov = innerWidth < 768 ? 62 : 50;
  stage.camera.updateProjectionMatrix();
  stage.renderer.setSize(innerWidth, innerHeight, false);
  if (post) post.setSize(innerWidth, innerHeight);
}, { passive: true });

// Context loss (GPU reset, driver update, too many contexts): show the CSS
// dusk fallback and stop touching the scene until the browser restores the
// context; three re-uploads geometry, textures and programs on its own.
let contextLost = false;
let sceneLive = false; // set once the canvas has drawn, to retire the CSS dusk backdrop
if (stage) {
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    contextLost = true;
    root.classList.add('no-webgl');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    root.classList.remove('no-webgl');
  });
}

// FPS watchdog: steps quality down one notch per sustained slump — lower
// render resolution, then post FX off, then fewer cloud march steps. Only a sustained slump
// counts: a window is restarted whenever the tab comes back or a single frame
// gap exceeds STALL_MS (tab switch, GC pause, dialog), and it takes two bad
// windows in a row to step down. The current level is mirrored on
// <html data-quality> for debugging and tests.
const STALL_MS = 250;
const QUALITY = ['full', 'reduced', 'no-post', 'minimal'];
const watch = { frames: 0, since: 0, last: 0, bad: 0, step: 0 };
const restartWatch = (now) => { watch.frames = 0; watch.since = now; watch.last = now; watch.bad = 0; };
if (stage) root.dataset.quality = QUALITY[0];
document.addEventListener('visibilitychange', () => restartWatch(performance.now()));
// Each call takes the next notch that actually changes something (a low-tier
// device already runs without post FX, so it skips that notch).
const MIN_SCALE = 0.3;
function stepDown() {
  const ratio = stage.renderer.getPixelRatio();
  if (watch.step < 1 && ratio > MIN_SCALE) {
    const next = Math.max(MIN_SCALE, ratio * 0.7);
    stage.renderer.setPixelRatio(next);
    if (post) post.setPixelRatio(next);
    watch.step = 1;
  } else if (watch.step < 2 && post) {
    post.dispose();
    post = null;
    watch.step = 2;
  } else if (watch.step < 3) {
    volume.reduceSteps();
    watch.step = 3;
  } else return;
  root.dataset.quality = QUALITY[watch.step];
}
function watchdog(now) {
  if (now - watch.last > STALL_MS) { restartWatch(now); return; }
  watch.last = now;
  if (++watch.frames < 90) return;
  const fps = (watch.frames * 1000) / (now - watch.since);
  watch.frames = 0; watch.since = now;
  if (fps >= 42) { watch.bad = 0; return; }
  if (++watch.bad >= 2) { watch.bad = 0; stepDown(); }
}

function frame(now) {
  requestAnimationFrame(frame);
  scroll.raf(now);
  const p = scroll.progress();
  chapters.update(p);
  if (!stage || contextLost || document.hidden) return;
  rig.update(p);
  volume.update(p, now / 1000, stage.camera, stage.renderer);
  // A light DOM veil on top of the raymarched cloud keeps each pass-through
  // soft even at the lowest step count.
  const [r, g, b] = paletteAt(p).horizon;
  const mistKey = `${(mistAt(altitudeAt(p)) * 0.5).toFixed(3)}|${mistColor.setRGB(r, g, b, THREE.SRGBColorSpace).lerp(WHITE, 0.55).getHexString(THREE.SRGBColorSpace)}`;
  if (mistKey !== lastMist) {
    lastMist = mistKey;
    const [m, hex] = mistKey.split('|');
    mistEl.style.setProperty('--mist', m);
    mistEl.style.setProperty('--mist-color', `#${hex}`);
  }
  watchdog(now);
  if (post) post.render(now / 1000);
  else stage.renderer.render(stage.scene, stage.camera);
  if (!sceneLive) { sceneLive = true; root.classList.add('scene-live'); }
}
requestAnimationFrame(frame);
