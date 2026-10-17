import * as THREE from 'three';
import { drawScreen, drawLive, SCREEN_W, SCREEN_H } from './screens.js';
import { liveStage } from '../widgets/live-state.js';

// Glass project cards orbiting the core. Each is a rounded plane whose shader
// refracts `tBg` — the scene behind the cards, rendered first each frame —
// through a noisy glass normal, frosts it with a small ring blur, lays the
// project's procedural screen on top, and rims the edge. The carousel is a
// continuous angle (`spin`, in card slots) so wheel input can glide and snap.
const CARD_W = 3.2, CARD_H = 2.0, RADIUS = 5.4;

const vert = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const frag = /* glsl */`
  uniform sampler2D tScreen;
  uniform sampler2D tBg;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uActive;   // 0 side card → 1 front card
  uniform float uOpen;     // 0 → 1 while this card is the open project
  uniform float uAlpha;
  uniform vec3 uTint;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(${(CARD_W / CARD_H).toFixed(3)}, 1.0);
    float d = sdRound(p, vec2(${(CARD_W / CARD_H / 2).toFixed(3)}, 0.5), 0.07);
    float aa = fwidth(d);
    float shape = smoothstep(aa, -aa, d);
    if (shape < 0.001) discard;

    // Glass: refract what's behind, bending harder toward the rim.
    vec2 suv = gl_FragCoord.xy / uRes;
    vec2 n = vec2(noise(vUv * 9.0 + uTime * 0.05), noise(vUv * 9.0 + 7.3 - uTime * 0.04)) - 0.5;
    float rim = smoothstep(-0.06, 0.0, d);
    vec2 bend = n * 0.025 + normalize(p + 1e-4) * rim * 0.03;
    vec2 r = 3.0 / uRes;
    vec3 bg = texture2D(tBg, suv + bend).rgb * 2.0
            + texture2D(tBg, suv + bend + vec2(r.x, 0.0)).rgb + texture2D(tBg, suv + bend - vec2(r.x, 0.0)).rgb
            + texture2D(tBg, suv + bend + vec2(0.0, r.y)).rgb + texture2D(tBg, suv + bend - vec2(0.0, r.y)).rgb;
    vec3 glass = bg / 6.0 * 0.85 + vec3(0.03, 0.06, 0.08);

    vec4 screen = texture2D(tScreen, vUv);
    float show = mix(0.28, 0.95, max(uActive, uOpen));
    vec3 col = mix(glass, screen.rgb, screen.a * show);
    // Faint scanlines on the screen, a lit rim, a sheen that drifts across.
    col *= 1.0 - 0.05 * step(0.5, fract(gl_FragCoord.y * 0.5));
    col += vec3(0.55, 0.85, 0.95) * smoothstep(0.012, 0.0, abs(d)) * (0.35 + 0.5 * uActive);
    col += vec3(0.08) * smoothstep(0.2, 0.0, abs(vUv.x + vUv.y * 0.4 - fract(uTime * 0.05) * 2.0 + 0.3));
    // The front card is under active scan: a tinted line sweeps down it.
    float sweep = fract(uTime * 0.22);
    float band = smoothstep(0.03, 0.0, abs(1.0 - vUv.y - sweep)) + smoothstep(0.25, 0.0, sweep - (1.0 - vUv.y)) * step(1.0 - vUv.y, sweep) * 0.12;
    col += uTint * band * uActive * (1.0 - uOpen) * 0.5;
    gl_FragColor = vec4(col, shape * uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function createCards(projects, { reducedMotion }) {
  const group = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(CARD_W, CARD_H);
  const bgTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const res = new THREE.Vector2(1, 1);
  const cards = projects.map((project, i) => {
    const canvas = document.createElement('canvas');
    canvas.width = SCREEN_W; canvas.height = SCREEN_H;
    drawScreen(canvas, project, i, projects.length);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const material = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: {
        tScreen: { value: texture }, tBg: { value: bgTarget.texture }, uRes: { value: res },
        uTime: { value: 0 }, uActive: { value: 0 }, uOpen: { value: 0 }, uAlpha: { value: 1 },
        uTint: { value: new THREE.Color().setHSL(project.hue, 0.75, 0.62) },
      },
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.id = project.id;
    group.add(mesh);
    return { project, mesh, material, texture, canvas, index: i, hasDossier: !!document.getElementById(`case-${project.id}`), shown: 1, open: 0, closing: false, live: false, drawnAt: 0, drawnStage: -1 };
  });
  // Titles use the web font: redraw once it's ready.
  document.fonts?.ready.then(() => cards.forEach((c, i) => { drawScreen(c.canvas, c.project, i, cards.length); c.texture.needsUpdate = true; }));

  const tmp = new THREE.Vector3();
  const right = new THREE.Vector3();
  const center = new THREE.Vector3(0, 0, 0);
  const corner = new THREE.Vector3();
  const up = new THREE.Vector3();
  return {
    group,
    cards,
    bgTarget,
    // scale: the backdrop's resolution vs the frame. The black hole's lens
    // redraws it unfrosted, so it's full-res except on the low tier.
    setSize(w, h, dpr, scale = 0.5) {
      bgTarget.setSize(Math.max(1, (w * dpr * scale) | 0), Math.max(1, (h * dpr * scale) | 0));
      res.set(w * dpr, h * dpr);
    },
    // spin: carousel position in slots (fractional while gliding); visible:
    // ids passing the filter; openId: the project in detail view; open: 0–1
    // eased detail transition; camera: to place the open card in front of it.
    update({ time, spin, visible, openId, open, camera, enter, fillDist = 5.2, tilt }) {
      const order = cards.filter((c) => visible.has(c.project.id));
      const n = Math.max(1, order.length);
      const dt = 1 / 60;
      cards.forEach((c) => {
        const k = order.indexOf(c);
        const target = k >= 0 ? 1 : 0;
        c.shown += (target - c.shown) * Math.min(1, dt * 7);
        // Leaving its detail view, a card is sinkholed: it falls into the
        // black hole, stretched, and re-emerges into its slot in the ring.
        if (c.project.id === openId) c.closing = false; else if (c.open > 0.02) c.closing = true;
        c.open += ((c.project.id === openId ? 1 : 0) - c.open) * Math.min(1, dt * (c.closing ? 3.2 : 5));
        if (reducedMotion()) { c.shown = target; c.open = c.project.id === openId ? 1 : 0; }
        // Wrap the slot offset into (-n/2, n/2] so the ring is continuous.
        let s = k - spin; s = ((s % n) + n) % n; if (s > n / 2) s -= n;
        const a = (s / n) * Math.PI * 2;
        const m = c.mesh;
        m.position.set(Math.sin(a) * RADIUS, Math.sin(a * 2 + time * 0.3) * 0.12 * (reducedMotion() ? 0 : 1), Math.cos(a) * RADIUS);
        // Mostly facing the camera (a pure outward ring shows side cards edge-on
        // or from behind), with enough yaw to read as a ring.
        m.rotation.set(0, a * 0.3, 0);
        // Entering the work view, the ring unfolds out of the core.
        m.position.multiplyScalar(0.2 + 0.8 * enter);
        const front = Math.max(0, 1 - Math.abs(s));
        // The open card leaves the ring and fills the frame in front of the camera.
        if (c.open > 0.001) {
          // In front of the camera, nudged right of centre to clear the copy panel.
          camera.getWorldDirection(tmp);
          const fill = tmp.multiplyScalar(fillDist).add(camera.position);
          fill.add(right.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(innerWidth >= 768 ? 0.75 : 0));
          // …and lifted, leaving room for the flow diagram underneath.
          fill.add(up.setFromMatrixColumn(camera.matrixWorld, 1).multiplyScalar(innerWidth >= 768 ? 0.42 : 0));
          if (c.closing && !reducedMotion()) {
            const s = 1 - c.open; // 0 → 1 over the close
            if (s < 0.5) {
              // Falling in: toward the centre, accelerating, spaghettified.
              const k = Math.pow(s * 2, 2.2);
              m.position.copy(fill).lerp(center, k);
              m.quaternion.slerp(camera.quaternion, 1);
              m.scale.set((1 + k * 2.2) * (1 - k * 0.9), 1 - k * 0.97, 1).multiplyScalar(enter);
            } else {
              // Re-emerging from the hole into its slot.
              const k = 1 - Math.pow(1 - (s - 0.5) * 2, 3);
              m.position.lerp(center, 1 - k);
              m.scale.setScalar(Math.max(1e-4, k) * c.shown * (0.85 + 0.15 * front) * enter);
            }
            c.squeezed = true;
          } else {
            m.position.lerp(fill, c.open * c.open * (3 - 2 * c.open));
            m.quaternion.slerp(camera.quaternion, c.open);
            // A hologram you can lean into: the open card tilts toward the cursor.
            if (tilt && !reducedMotion()) { m.rotateY(tilt.x * 0.16 * c.open); m.rotateX(-tilt.y * 0.11 * c.open); }
            c.squeezed = false;
          }
        } else c.squeezed = false;
        if (!c.squeezed) m.scale.setScalar(c.shown * (0.85 + 0.15 * front) * enter + 1e-4);
        m.visible = c.shown * enter > 0.01;
        // The open card's screen goes live (synced to the flow diagram); it
        // reverts to its still motif once it's back in the ring.
        const wantLive = c.project.id === openId && c.open > 0.3;
        if (wantLive) {
          const now = performance.now();
          const stage = liveStage.id === c.project.id ? liveStage.index : 0;
          const still = reducedMotion();
          if (!c.live || stage !== c.drawnStage || (!still && now - c.drawnAt > 66)) {
            drawLive(c.canvas, c.project, c.index, cards.length, { stage, stageT: liveStage.pinned ? 1e9 : now - liveStage.t0, now, reduced: still, stepMs: 3200, hasDossier: c.hasDossier });
            c.texture.needsUpdate = true;
            c.live = true; c.drawnAt = now; c.drawnStage = stage;
          }
        } else if (c.live) {
          drawScreen(c.canvas, c.project, c.index, cards.length);
          c.texture.needsUpdate = true;
          c.live = false; c.drawnStage = -1;
        }
        const u = c.material.uniforms;
        u.uTime.value = reducedMotion() ? 0 : time;
        u.uActive.value = front;
        u.uOpen.value = c.open;
        u.uAlpha.value = Math.min(1, c.shown * enter) * (openId && c.project.id !== openId ? 1 - open * 0.9 : 1);
      });
    },
    // A card's bounding box on screen, CSS px (for the reveal effects).
    rectOf(id, camera) {
      const c = cards.find((k) => k.project.id === id);
      if (!c || !c.mesh.visible) return null;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        corner.set(sx * CARD_W / 2, sy * CARD_H / 2, 0).applyMatrix4(c.mesh.matrixWorld).project(camera);
        const x = (corner.x * 0.5 + 0.5) * innerWidth, y = (0.5 - corner.y * 0.5) * innerHeight;
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    },
    pick(raycaster) {
      const hit = raycaster.intersectObjects(cards.filter((c) => c.mesh.visible).map((c) => c.mesh))[0];
      return hit ? hit.object.userData.id : null;
    },
    dispose() {
      geometry.dispose(); bgTarget.dispose();
      cards.forEach((c) => { c.material.dispose(); c.texture.dispose(); });
    },
  };
}
