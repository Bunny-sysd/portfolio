import './styles/base.css';
import './styles/chapters.css';
import { createScroll } from './scroll.js';
import { createChapters } from './chapters.js';
import { buildMailto } from './contact.js';
import { createStage } from './scene/stage.js';
import { createSky } from './scene/sky.js';
import { createCameraRig } from './scene/camera.js';

const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => reduceQuery.matches;

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

addEventListener('resize', () => {
  if (!stage) return;
  stage.camera.aspect = innerWidth / innerHeight;
  stage.camera.fov = innerWidth < 768 ? 62 : 50;
  stage.camera.updateProjectionMatrix();
  stage.renderer.setSize(innerWidth, innerHeight, false);
}, { passive: true });

function frame(now) {
  requestAnimationFrame(frame);
  scroll.raf(now);
  const p = scroll.progress();
  chapters.update(p);
  if (!stage || document.hidden) return;
  rig.update(p);
  sky.update(p, stage.camera);
  stage.renderer.render(stage.scene, stage.camera);
}
requestAnimationFrame(frame);
