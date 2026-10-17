import * as THREE from 'three';
import { createCards } from './cards.js';
import { createEnvironment } from './environment.js';
import { createNetFloor } from './netfloor.js';
import { createPerimeter } from './perimeter.js';
import { createCensus } from './census.js';
import { createBlackHole } from './blackhole.js';
import { createInfall } from './infall.js';
import { createStars } from './stars.js';

// The whole 3D world: a black hole (the sinkhole), orbiting glass cards, a far dust field,
// and a camera that moves between per-view marks. Views ease into each other
// (critically damped), so a route change reads as one camera move; under
// reduced motion every eased value snaps.
// Home stands back down the corridor between the towers, looking past the
// copy at the core (framed right of centre); entering work flies the camera
// up the corridor into the vault.
const MARKS = {
  home:    { pos: new THREE.Vector3(-2.4, 0.2, 30.0), look: new THREE.Vector3(-4.6, 0.6, 0), fov: 34 },
  work:    { pos: new THREE.Vector3(0, 2.4, 15.0),    look: new THREE.Vector3(0, 0.3, 2.5), fov: 40 },
};
MARKS.detail = MARKS.work;
// Contact is across the event horizon: the camera falls into the hole.
MARKS.contact = { pos: new THREE.Vector3(0, 0.35, 2.4), look: new THREE.Vector3(0, 0, 0), fov: 78 };
// Portrait screens stack the hero copy under the core: aim lower so the core
// rides in the top half instead of sitting behind the text.
const PORTRAIT_HOME = { pos: new THREE.Vector3(0, -0.6, 27.0), look: new THREE.Vector3(0, -4.4, 0), fov: 46 };
const PORTRAIT_WORK = { pos: new THREE.Vector3(0, 2.4, 19.0), look: new THREE.Vector3(0, 0.0, 2.5), fov: 50 };

// The establishing shot: a crane-down from high over the address space,
// through the towers, onto the home mark. Camera and aim each ride a
// Catmull-Rom spline (the aim slightly ahead of the camera, so it always
// faces where it's going).
const INTRO_S = 6.0;
const introPath = (end) => ({
  pos: new THREE.CatmullRomCurve3([new THREE.Vector3(26, 38, 70), new THREE.Vector3(14, 20, 52), new THREE.Vector3(3, 5, 40), end.pos.clone()]),
  look: new THREE.CatmullRomCurve3([new THREE.Vector3(0, -3, -10), new THREE.Vector3(-1, -1, -4), new THREE.Vector3(-3, 0.4, -1), end.look.clone()]),
});
const smoothstep = (t) => t * t * (3 - 2 * t);

function createDust(count = 2500) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 12 + Math.random() * 30, a = Math.random() * 6.28, y = (Math.random() - 0.5) * 30;
    pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  // Round sprites: the stock material draws squares, which read as glitches up close.
  const dot = document.createElement('canvas');
  dot.width = dot.height = 32;
  const g2 = dot.getContext('2d');
  const grad = g2.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, '#fff'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g2.fillStyle = grad; g2.fillRect(0, 0, 32, 32);
  const m = new THREE.PointsMaterial({ size: 0.08, map: new THREE.CanvasTexture(dot), color: new THREE.Color('#7fb8c9'), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  return new THREE.Points(g, m);
}

export function createWorld(stage, { projects, reducedMotion }) {
  const { scene, camera, renderer } = stage;
  const cards = createCards(projects, { reducedMotion });
  const dust = createDust();
  const env = createEnvironment({ tier: stage.tier, reducedMotion });
  const net = createNetFloor();
  const perimeter = createPerimeter({ tier: stage.tier });
  const census = createCensus();
  const hole = createBlackHole({ tier: stage.tier, reducedMotion });
  // The glass cards refract the backdrop *with* the hole traced into it.
  cards.cards.forEach((c) => { c.material.uniforms.tBg.value = hole.target.texture; });
  const infall = createInfall({ tier: stage.tier });
  const stars = createStars({ tier: stage.tier });
  scene.add(stars.object, census.object, env.group, net.object, perimeter.group, infall.object, hole.group, cards.group, dust);
  // Only the top tier ray-traces the hole into a backdrop and mirrors the
  // water — both re-render the whole scene and are far too heavy for a phone.
  const fullHole = stage.tier === 'high';
  // The water's mirror re-renders the scene: keep the lens out of it (it
  // samples this frame's backdrop in screen space, meaningless in the mirror).
  if (fullHole && env.water.onBeforeRender) {
    const mirrorRender = env.water.onBeforeRender;
    env.water.onBeforeRender = function (...args) { hole.lens.visible = false; mirrorRender.apply(this, args); hole.lens.visible = true; };
  }
  const bgScale = 1;
  const drawRes = new THREE.Vector2();
  scene.background = new THREE.Color('#03060b');
  scene.fog = new THREE.FogExp2('#03060b', 0.03); // dust only; the custom shaders fog themselves

  const look = MARKS.home.look.clone();
  // The camera eases its *base* toward each view's mark; pointer parallax is
  // added on top per frame as a pure offset. (Adding it to the eased position
  // itself compounded every frame until the camera sat ~12 units off its mark.)
  const base = MARKS.home.pos.clone();
  camera.position.copy(base);
  // Centre until a real pointer moves (touch screens may never send one).
  const pointer = new THREE.Vector2(0, 0);
  const smooth = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const onMove = (e) => { pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); };
  addEventListener('pointermove', onMove, { passive: true });

  // The world takes on the colour of the project in focus; home is cyan.
  const HOME_TINT = new THREE.Color('#7dd3fc');
  const tint = HOME_TINT.clone();
  const tintTarget = new THREE.Color();
  const eased = { enter: 0, open: 0, focus: 0, pulse: 0, spin: 0, last: 0 };
  let intro = null; // { t: 0 → 1, path }
  const setSize = () => { cards.setSize(innerWidth, innerHeight, renderer.getPixelRatio(), bgScale); env.setSize(innerWidth, innerHeight); };
  setSize();

  return {
    cards,
    perimeter,
    hole,
    setSize,
    // Runs the establishing shot; resolves done() on finish or skip.
    playIntro() {
      if (reducedMotion()) return false;
      intro = { t: 0, path: introPath(camera.aspect < 0.8 ? PORTRAIT_HOME : MARKS.home) };
      return true;
    },
    // Any input cuts the shot: the camera glides from wherever it is.
    skipIntro() { intro = null; },
    get introPlaying() { return !!intro; },
    // state: { view, spin, visible: Set<id>, openId, pulse }
    update(state, time) {
      const dt = eased.last ? Math.min(0.1, time - eased.last) : 1 / 60;
      eased.last = time;
      const snap = reducedMotion();
      const ease = (k) => (snap ? 1 : 1 - Math.exp(-dt * k));
      const inWork = state.view !== 'home';
      eased.enter += ((inWork ? 1 : 0) - eased.enter) * ease(3.2);
      eased.open += ((state.view === 'detail' ? 1 : 0) - eased.open) * ease(4.5);
      eased.focus += ((state.view === 'detail' ? 1 : 0) - eased.focus) * ease(3);
      eased.pulse = snap ? 0 : Math.max(0, eased.pulse - dt * 1.6);
      if (state.pulse) { eased.pulse = snap ? 0 : 1; state.pulse = 0; }
      // The ring glides to its slot; a big jump (filtering) takes the short way round.
      eased.spin += (state.spin - eased.spin) * ease(6);

      const portrait = camera.aspect < 0.8;
      let mark = MARKS[state.view] || MARKS.home;
      if (portrait && mark !== MARKS.contact) mark = mark === MARKS.home ? PORTRAIT_HOME : PORTRAIT_WORK;
      if (intro) {
        intro.t = Math.min(1, intro.t + dt / INTRO_S);
        const k = smoothstep(intro.t);
        intro.path.pos.getPoint(k, base);
        intro.path.look.getPoint(Math.min(1, k + 0.02), look);
        if (intro.t >= 1) intro = null;
      } else {
        base.lerp(mark.pos, ease(2.6));
        look.lerp(mark.look, ease(2.6));
      }
      if (snap) smooth.set(0, 0); else smooth.lerp(pointer.clone().clampScalar(-1, 1), ease(2));
      // A breathing, hand-held camera: two slow incommensurate sines, a few
      // centimetres — off under reduced motion.
      const hx = snap ? 0 : Math.sin(time * 0.63) * 0.035 + Math.sin(time * 1.37) * 0.015;
      const hy = snap ? 0 : Math.sin(time * 0.81 + 1.7) * 0.025 + Math.sin(time * 1.91) * 0.01;
      // The pointer orbits the view round the hole (parallax is what sells it
      // as an object in space), plus a slow drift of its own.
      const drift = snap ? 0 : Math.sin(time * 0.09) * 0.9;
      camera.position.set(
        base.x + (smooth.x * 1.6 + drift) * (1 - eased.open) + hx,
        base.y + smooth.y * 0.8 * (1 - eased.open) + hy,
        base.z,
      );
      camera.lookAt(look);
      // Opening a project is a dolly zoom (the "Vertigo" shot): the lens
      // widens mid-move while the card is pulled in to hold its size, so the
      // world behind stretches away. Peaks halfway, back to the mark's lens.
      const dolly = snap ? 0 : Math.sin(Math.PI * eased.open) * 24;
      const fov = mark.fov + eased.pulse * 4 + dolly;
      if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld();

      const half = (deg) => Math.tan((deg * Math.PI) / 360);
      // Far enough that the whole card (3.2 wide, plus margin) fits the
      // screen's width — on a phone that's well back from the desktop 5.2.
      const fitDist = Math.max(5.2, 1.6 * 1.12 / (half(mark.fov) * camera.aspect));
      const fillDist = fitDist * half(mark.fov) / half(camera.fov);
      cards.update({ time, spin: eased.spin, visible: state.visible, openId: state.openId, open: eased.open, camera, enter: eased.enter, fillDist, tilt: smooth });
      dust.rotation.y = snap ? 0 : time * 0.01;
      env.update({ time, dpr: renderer.getPixelRatio(), enter: eased.enter });
      const tm = snap ? 0 : time;
      const order = projects.filter((p) => state.visible.has(p.id));
      const focus = state.view === 'home' ? null : (state.openId ? projects.find((p) => p.id === state.openId) : order[state.index]);
      if (focus) tintTarget.setHSL(focus.hue, 0.75, 0.62); else tintTarget.copy(HOME_TINT);
      tint.lerp(tintTarget, ease(3));
      net.update({ time: tm, enter: eased.enter, tint });
      census.update({ time: tm, enter: eased.enter, tint });
      // The probes stand down while a project is open, so the card reads clean.
      perimeter.update({ time: tm, dpr: renderer.getPixelRatio(), fade: 1 - 0.8 * eased.open });
      infall.update({ time: tm, fade: 1 - 0.6 * eased.open });
      stars.update({ dpr: renderer.getPixelRatio() });
      renderer.getDrawingBufferSize(drawRes);
      hole.update({ time, camera, res: drawRes, pulse: eased.pulse, focus: eased.focus });
      return { open: eased.open, enter: eased.enter };
    },
    // Glass needs what's behind it: draw everything but the cards first.
    // Top tier only: render the scene (minus cards and lens) into a backdrop
    // and ray-trace the hole into it. On phones/tablets this whole extra pass
    // is skipped — the cheap hole needs no backdrop, so cards show dark glass.
    renderBackdrop() {
      if (!fullHole) return;
      const prev = renderer.getRenderTarget();
      cards.group.visible = false;
      hole.lens.visible = false;
      renderer.setRenderTarget(cards.bgTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(prev);
      hole.render(renderer, camera, cards.bgTarget);
      hole.lens.visible = true;
      cards.group.visible = true;
    },
    cardRect: (id) => cards.rectOf(id, camera),
    pick(clientX, clientY) {
      ray.setFromCamera(new THREE.Vector2((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1), camera);
      return cards.pick(ray);
    },
    dispose() {
      removeEventListener('pointermove', onMove);
      hole.dispose(); cards.dispose(); env.dispose(); net.dispose(); perimeter.dispose(); census.dispose(); infall.dispose(); stars.dispose();
      dust.geometry.dispose(); dust.material.map.dispose(); dust.material.dispose();
    },
  };
}
