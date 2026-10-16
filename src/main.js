import './styles/site.css';
import './styles/case-study.css';
import { PROJECTS } from './projects.js';
import { createRouter } from './router.js';
import { createViews } from './views.js';
import { createTerminal } from './terminal.js';
import { initCaseStudies } from './case-study.js';
import { buildMailto } from './contact.js';
import { createStage } from './scene/stage.js';
import { createWorld } from './scene/world.js';
import { createPost } from './scene/post.js';
import { createBootReadout } from './widgets/boot.js';
import { createAvalanche } from './widgets/avalanche.js';
import { createSigil } from './widgets/sigil.js';
import { createProbe } from './widgets/probe.js';
import { createSound } from './widgets/sound.js';
import { createCipher } from './widgets/cipher.js';

const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => reduceQuery.matches;
const root = document.documentElement;

// ── scene ────────────────────────────────────────────────────────────────
const canvas = document.getElementById('scene');
const stage = createStage(canvas);
if (!stage) root.classList.add('no-webgl');
if (import.meta.env.DEV) window.__stage = stage; // dev-only handle for GPU timing (tests/e2e/_gpu.mjs)
const world = stage && createWorld(stage, { projects: PROJECTS, reducedMotion });
if (import.meta.env.DEV) window.__world = world; // dev-only: card positions for e2e checks
let post = stage && stage.settings.postFX ? createPost(stage.renderer, stage.scene, stage.camera, { reducedMotion, contactFull: true }) : null;
root.classList.toggle('post-live', !!post);
if (import.meta.env.DEV) window.__fluidEnergy = () => post?.fluidEnergy() ?? null; // dev-only: e2e fluid check

// ── views, routing, dossiers ─────────────────────────────────────────────
// The case-study dive (camera plunge + streak) is driven from here.
const film = { dive: 0, diveTarget: 0, contact: 0, glitch: 0, last: 0 };
const caseStudies = initCaseStudies({ scroll: { stop() {}, start() {} }, onDive: (on) => { film.diveTarget = on ? 1 : 0; } });
// ── address-space layer: avalanche transitions, sigils, probe, sound ─────
const avalanche = createAvalanche(document.querySelector('.avalanche'), { reduced: reducedMotion });
const sound = createSound(document.querySelector('.sound'));
createProbe(document, { reduced: reducedMotion, gravity: world ? () => world.hole.screen : null });
const idSigil = createSigil(document.querySelector('.hud-id .sigil'), { reduced: reducedMotion });
idSigil.set('Aaron Alva').then((hex) => { if (hex) document.querySelector('.hud-id__hash').textContent = `sha256 ${hex.slice(0, 8)}…`; });
const capSigil = createSigil(document.querySelector('.caption .sigil'), { reduced: reducedMotion });
const capHash = document.querySelector('.caption__hash');
const lastPointer = { x: innerWidth / 2, y: innerHeight / 2 };
addEventListener('pointerdown', (e) => { lastPointer.x = e.clientX; lastPointer.y = e.clientY; }, { passive: true, capture: true });

let router;
const views = createViews(document, {
  onCaption: (p) => capSigil.set(p.title).then((hex) => { if (hex) capHash.textContent = `sha256 ${hex.slice(0, 12)}…`; }),
  onStep: () => sound.tick(),
  router: { go: (r) => router.go(r) },
  reduced: reducedMotion,
  pick: world ? (x, y) => world.pick(x, y) : null,
  openDossier: (id, origin) => caseStudies.open(id, origin),
});
router = createRouter((route, prev) => {
  views.apply(route, prev);
  // Every view change is an input change: the avalanche runs from where you acted.
  if (prev && prev.view !== route.view && avalanche.trigger(lastPointer.x, lastPointer.y)) { sound.cascade(); film.glitch = 1; }
});
router.start();
const terminal = createTerminal(document.querySelector('.term'), { go: (r) => router.go(r) });
// Ctrl/⌘+K (or /) summons the terminal from anywhere, home included.
addEventListener('keydown', (e) => {
  const typing = e.target.closest?.('input, textarea');
  if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing)) {
    if (document.querySelector('dialog[open]')) return;
    e.preventDefault();
    if (views.state.view === 'detail' || views.state.view === 'contact') router.go({ view: 'work' });
    root.classList.add('term-summoned');
    terminal.focus();
  }
});
// Live tally from the perimeter simulation (twice a second is plenty).
const blockedEl = document.querySelector('[data-blocked]');
if (world) setInterval(() => { if (!document.hidden) blockedEl.textContent = world.perimeter.blocked.toLocaleString('en-US'); }, 500);

const form = document.getElementById('contact-form');
createCipher(form.elements.message, form.querySelector('.cipher'));
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const note = form.querySelector('.form-note');
  const message = form.elements.message.value;
  if (!message.trim()) { note.textContent = 'Add a message first.'; return; }
  window.location.href = buildMailto(form.elements.name.value, message);
  note.textContent = 'Opening your email app with the message filled in…';
});

if (!stage) { root.classList.add('scene-live'); }

addEventListener('resize', () => {
  if (!stage) return;
  stage.camera.aspect = innerWidth / innerHeight;
  stage.camera.updateProjectionMatrix();
  stage.renderer.setSize(innerWidth, innerHeight, false);
  world.setSize();
  if (post) post.setSize(innerWidth, innerHeight);
}, { passive: true });

// ── context loss ─────────────────────────────────────────────────────────
let contextLost = false;
let sceneLive = false;
if (stage) {
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); contextLost = true; root.classList.add('no-webgl'); });
  canvas.addEventListener('webglcontextrestored', () => { contextLost = false; root.classList.remove('no-webgl'); });
}

// ── async shader compile ─────────────────────────────────────────────────
// Compile off the main thread (KHR_parallel_shader_compile) before the first
// draw, against the target the scene is actually drawn into — programs are
// keyed by render target. The boot readout runs meanwhile.
let sceneReady = !stage;
const boot = stage ? createBootReadout(document.body, { reduced: reducedMotion() }) : null;
if (stage) {
  const prevTarget = stage.renderer.getRenderTarget();
  if (post) stage.renderer.setRenderTarget(post.sceneTarget);
  const compiling = [stage.renderer.compileAsync(stage.scene, stage.camera)];
  // The black hole's ray tracer lives in its own scene and draws into its
  // own target; it's the heaviest shader on the page, so it compiles here too.
  stage.renderer.setRenderTarget(world.hole.target);
  compiling.push(stage.renderer.compileAsync(world.hole.traceScene, stage.camera));
  if (post) stage.renderer.setRenderTarget(post.sceneTarget);
  stage.renderer.setRenderTarget(prevTarget);
  if (post) compiling.push(post.precompile());
  Promise.all(compiling).catch(() => {}).then(() => { sceneReady = true; });
}

// ── establishing shot ────────────────────────────────────────────────────
// Once per session, landing on home: letterboxed crane-down onto the home
// mark, copy held back until it lands. Any input cuts it; reduced motion and
// deep links never see it.
const INTRO_KEY = 'aa-intro';
let introOn = false;
const seenIntro = () => { try { return sessionStorage.getItem(INTRO_KEY) === 'seen'; } catch { return true; } };
const cut = () => { if (introOn) world.skipIntro(); };
const CUT_EVENTS = ['wheel', 'pointerdown', 'keydown', 'touchstart'];
function startIntro() {
  if (seenIntro() || views.state.view !== 'home' || !world.playIntro()) return;
  introOn = true;
  root.classList.add('is-intro');
  CUT_EVENTS.forEach((ev) => addEventListener(ev, cut, { passive: true, capture: true }));
}
function endIntro() {
  introOn = false;
  root.classList.remove('is-intro');
  CUT_EVENTS.forEach((ev) => removeEventListener(ev, cut, { capture: true }));
  try { sessionStorage.setItem(INTRO_KEY, 'seen'); } catch { /* private mode: replays, harmless */ }
}

// ── FPS watchdog ─────────────────────────────────────────────────────────
// Steps quality down one notch per sustained slump (two bad 90-frame windows
// in a row): lower resolution, then post FX off. Tab switches and one-off
// stalls (>250 ms gaps) restart the window. Mirrored on <html data-quality>.
const STALL_MS = 250;
const QUALITY = ['full', 'reduced', 'no-post'];
const watch = { frames: 0, since: 0, last: 0, bad: 0, step: 0 };
const restartWatch = (now) => { watch.frames = 0; watch.since = now; watch.last = now; watch.bad = 0; };
if (stage) root.dataset.quality = QUALITY[0];
document.addEventListener('visibilitychange', () => restartWatch(performance.now()));
const MIN_SCALE = 0.5;
function stepDown() {
  const ratio = stage.renderer.getPixelRatio();
  if (watch.step < 1 && ratio > MIN_SCALE) {
    const next = Math.max(MIN_SCALE, ratio * 0.7);
    stage.renderer.setPixelRatio(next);
    if (post) post.setPixelRatio(next);
    world.setSize();
    watch.step = 1;
  } else if (watch.step < 2 && post) {
    post.dispose();
    post = null;
    root.classList.remove('post-live');
    watch.step = 2;
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

// ── frame loop ───────────────────────────────────────────────────────────
function frame(now) {
  requestAnimationFrame(frame);
  if (!stage || !sceneReady || contextLost || document.hidden) return;
  const t = now / 1000;
  const dt = Math.min(0.1, Math.max(0, t - film.last)); film.last = t;
  const k = reducedMotion() ? 1 : 1 - Math.exp(-dt * 4.5);
  film.dive += (film.diveTarget - film.dive) * k;
  film.glitch = Math.max(0, film.glitch - dt * 3.2);
  film.contact += ((views.state.view === 'contact' ? 1 : 0) - film.contact) * (reducedMotion() ? 1 : 1 - Math.exp(-dt * 5));
  // Behind the contact overlay the scene settles back to the ring.
  const sceneState = { ...views.state, view: views.state.view === 'contact' ? (views.state.base === 'home' ? 'home' : 'work') : views.state.view };
  if (views.state.view === 'contact') sceneState.openId = null;
  const { open } = world.update(sceneState, t);
  views.state.pulse = sceneState.pulse;
  watchdog(now);
  world.renderBackdrop();
  // The detail shot reuses the dive streak: opening a project smears the
  // room as its card flies in, then settles.
  const streak = reducedMotion() ? 0 : Math.max(film.dive, open * (1 - open) * 4 * 0.6);
  if (post) post.render(t, { dive: streak, contact: film.contact, glitch: film.glitch });
  else stage.renderer.render(stage.scene, stage.camera);
  if (!sceneLive) {
    sceneLive = true; root.classList.add('scene-live'); boot?.done();
    // Channel up: the first frame decrypts out from the centre.
    if (avalanche.trigger(innerWidth / 2, innerHeight / 2)) film.glitch = 0.7;
    startIntro();
  }
  if (introOn && !world.introPlaying) endIntro();
}
requestAnimationFrame(frame);
