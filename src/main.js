import * as THREE from 'three';
import './styles/base.css';
import './styles/chapters.css';
import { createScroll } from './scroll.js';
import { createChapters } from './chapters.js';
import { buildMailto } from './contact.js';
import { createStage } from './scene/stage.js';
import { createSky } from './scene/sky.js';
import { createCameraRig } from './scene/camera.js';
import { createClouds } from './scene/clouds.js';
import { createCity } from './scene/city.js';
import { createPost } from './scene/post.js';

const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => reduceQuery.matches;
const WHITE = new THREE.Color(1, 1, 1);
const mistColor = new THREE.Color();

const scroll = createScroll({ reducedMotion });
const chapters = createChapters(document);

document.getElementById('to-top').addEventListener('click', (e) => {
  e.preventDefault();
  scroll.scrollToProgress(0);
});

const form = document.getElementById('contact-form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const note = form.querySelector('.form-note');
  const message = form.message.value;
  if (!message.trim()) { note.textContent = 'Add a message first.'; return; }
  window.location.href = buildMailto(form.name.value, message);
  note.textContent = 'Opening your email app with the message filled in…';
});

const stage = createStage(document.getElementById('scene'));
if (!stage) document.documentElement.classList.add('no-webgl');
const sky = stage && createSky(stage.scene);
const rig = stage && createCameraRig(stage.camera, { reducedMotion });
const clouds = stage && createClouds(stage.scene, { sheetsPerLayer: stage.settings.sheetsPerLayer, reducedMotion });
const city = stage && createCity(stage.scene, { lights: stage.settings.cityLights, reducedMotion });
const mistEl = document.querySelector('.mist');
let post = stage && stage.settings.postFX ? createPost(stage.renderer, stage.scene, stage.camera, { reducedMotion }) : null;

addEventListener('resize', () => {
  if (!stage) return;
  stage.camera.aspect = innerWidth / innerHeight;
  stage.camera.fov = innerWidth < 768 ? 62 : 50;
  stage.camera.updateProjectionMatrix();
  stage.renderer.setSize(innerWidth, innerHeight, false);
  if (post) post.setSize(innerWidth, innerHeight);
}, { passive: true });

const watch = { frames: 0, since: performance.now(), step: 0 };
function watchdog(now) {
  if (++watch.frames < 90) return;
  const fps = (watch.frames * 1000) / (now - watch.since);
  watch.frames = 0; watch.since = now;
  if (fps >= 42 || !stage) return;
  if (watch.step === 0) {
    watch.step = 1;
    stage.renderer.setPixelRatio(1);
    if (post) post.setPixelRatio(1);
  } else if (watch.step === 1 && post) {
    watch.step = 2;
    post.dispose();
    post = null;
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  scroll.raf(now);
  const p = scroll.progress();
  chapters.update(p);
  if (!stage || document.hidden) return;
  rig.update(p);
  sky.update(p, stage.camera);
  const mist = clouds.update(p, now / 1000, stage.camera, sky.colors);
  city.update(p, now / 1000, stage.camera);
  mistEl.style.setProperty('--mist', (mist * 0.85).toFixed(3));
  mistEl.style.setProperty('--mist-color', `#${mistColor.copy(sky.colors.horizon).lerp(WHITE, 0.55).getHexString(THREE.SRGBColorSpace)}`);
  watchdog(now);
  if (post) post.render(now / 1000);
  else stage.renderer.render(stage.scene, stage.camera);
}
requestAnimationFrame(frame);
