import * as THREE from 'three';
import { createCore } from './core.js';
import { createCards } from './cards.js';
import { createEnvironment } from './environment.js';

// The whole 3D world: particle core, orbiting glass cards, a far dust field,
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
MARKS.contact = MARKS.work;
// Portrait screens stack the hero copy under the core: aim lower so the core
// rides in the top half instead of sitting behind the text.
const PORTRAIT_HOME = { pos: new THREE.Vector3(0, -0.6, 27.0), look: new THREE.Vector3(0, -4.4, 0), fov: 46 };
const PORTRAIT_WORK = { pos: new THREE.Vector3(0, 2.4, 19.0), look: new THREE.Vector3(0, 0.0, 2.5), fov: 50 };

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
  const core = createCore({ count: stage.tier === 'low' ? 24000 : 60000, reducedMotion });
  const cards = createCards(projects, { reducedMotion });
  const dust = createDust();
  const env = createEnvironment({ tier: stage.tier, reducedMotion });
  scene.add(env.group, core.object, cards.group, dust);
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
  let pointerSeen = false;
  const smooth = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3(99, 99, 99);
  const onMove = (e) => { pointerSeen = true; pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); };
  addEventListener('pointermove', onMove, { passive: true });

  const eased = { enter: 0, open: 0, focus: 0, pulse: 0, spin: 0, last: 0 };
  const setSize = () => { cards.setSize(innerWidth, innerHeight, renderer.getPixelRatio()); env.setSize(innerWidth, innerHeight); };
  setSize();

  return {
    cards,
    setSize,
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
      if (portrait) mark = mark === MARKS.home ? PORTRAIT_HOME : PORTRAIT_WORK;
      base.lerp(mark.pos, ease(2.6));
      look.lerp(mark.look, ease(2.6));
      if (snap) smooth.set(0, 0); else smooth.lerp(pointer.clone().clampScalar(-1, 1), ease(2));
      camera.position.set(
        base.x + smooth.x * 0.6 * (1 - eased.open),
        base.y + smooth.y * 0.35 * (1 - eased.open),
        base.z,
      );
      camera.lookAt(look);
      const fov = mark.fov + eased.pulse * 4;
      if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld();

      // Pointer ray against the core's plane, so the cloud parts under the cursor.
      ray.setFromCamera(pointer, camera);
      if (!snap && pointerSeen && ray.ray.intersectPlane(plane, hit)) core.update({ time, pulse: eased.pulse, focus: eased.focus, dpr: renderer.getPixelRatio(), pointer: hit });
      else core.update({ time, pulse: eased.pulse, focus: eased.focus, dpr: renderer.getPixelRatio(), pointer: hit.set(99, 99, 99) });
      cards.update({ time, spin: eased.spin, visible: state.visible, openId: state.openId, open: eased.open, camera, enter: eased.enter });
      dust.rotation.y = snap ? 0 : time * 0.01;
      env.update({ time, dpr: renderer.getPixelRatio(), enter: eased.enter });
      return { open: eased.open, enter: eased.enter };
    },
    // Glass needs what's behind it: draw everything but the cards first.
    renderBackdrop() {
      if (!cards.group.children.some((m) => m.visible)) return;
      const prev = renderer.getRenderTarget();
      // The water re-renders the scene for its mirror: skip it here, the
      // glass only needs the towers and core behind it.
      cards.group.visible = false;
      env.water.visible = false;
      renderer.setRenderTarget(cards.bgTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(prev);
      env.water.visible = true;
      cards.group.visible = true;
    },
    pick(clientX, clientY) {
      ray.setFromCamera(new THREE.Vector2((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1), camera);
      return cards.pick(ray);
    },
    dispose() {
      removeEventListener('pointermove', onMove);
      core.dispose(); cards.dispose(); env.dispose();
      dust.geometry.dispose(); dust.material.map.dispose(); dust.material.dispose();
    },
  };
}
