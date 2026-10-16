import * as THREE from 'three';

// Cursor "fluid": a small velocity field (one semi-Lagrangian self-advection
// step per frame plus a splat along the pointer's path) that the post chain
// uses to push the rendered frame around. No pressure solve — the field only
// has to look like stirred air, not conserve mass — so it's one tiny pass on a
// ~128px target. Decorative only: under reduced motion no splats are added and
// the field stays at zero.
const SIM = 128;

const quadVert = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const simFrag = /* glsl */`
  uniform sampler2D tVel;
  uniform vec2 uFrom;
  uniform vec2 uTo;
  uniform vec2 uForce;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uDt;
  uniform float uDecay;
  varying vec2 vUv;
  void main() {
    vec2 vel = texture2D(tVel, vUv - texture2D(tVel, vUv).xy * uDt).xy * uDecay;
    // Distance to the segment the pointer travelled this frame, so a fast
    // flick leaves a continuous wake rather than a row of dots.
    vec2 a = uFrom * vec2(uAspect, 1.0), b = uTo * vec2(uAspect, 1.0), p = vUv * vec2(uAspect, 1.0);
    vec2 ab = b - a;
    float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    vec2 d = p - (a + ab * t);
    vel += uForce * exp(-dot(d, d) / uRadius);
    gl_FragColor = vec4(clamp(vel, -4.0, 4.0), 0.0, 1.0);
  }`;

export const FluidShader = {
  uniforms: {
    tDiffuse: { value: null }, tVel: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 },
    uStrength: { value: 0.012 }, uShift: { value: 0.0035 }, uFrost: { value: 1 }, uFrostR: { value: 420 }, uDive: { value: 0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform sampler2D tVel;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uStrength;
    uniform float uShift;
    uniform float uFrost;
    uniform float uDive;
    uniform float uFrostR;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
    }
    void main() {
      vec2 vel = texture2D(tVel, vUv).xy;
      float speed = length(vel);
      vec2 off = vel / max(speed, 1e-4) * min(speed * uStrength, 0.022);

      // Frosted glass in the top-right corner, behind the nav pill: a ripple
      // of noise "normals" refracts the frame there, brightened a touch.
      vec2 px = vUv * uResolution;
      float corner = length((uResolution - px) / uFrostR);
      float frost = smoothstep(1.0, 0.0, corner) * uFrost;
      vec2 q = px / 46.0;
      vec2 n = vec2(noise(q + vec2(uTime * 0.25, 0.0)) - noise(q + vec2(1.7, 0.0)),
                    noise(q + vec2(0.0, 3.1 - uTime * 0.2)) - noise(q + vec2(0.0, 4.9))) ;
      off += n * frost * 0.012;

      vec2 uv = vUv - off;
      vec2 split = vel / max(speed, 1e-4) * min(speed * uShift, 0.006);
      vec3 col = vec3(texture2D(tDiffuse, uv + split).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - split).b);

      // Case-study dive: the frame streaks toward the centre like a tunnel —
      // a radial smear, stretched horizontally, strongest at the edges.
      if (uDive > 0.002) {
        vec2 toC = uv - 0.5;
        float edge = smoothstep(0.05, 0.75, length(toC * vec2(1.0, 0.6)));
        vec2 stepv = toC * vec2(1.6, 0.35) * 0.028 * uDive * edge;
        vec3 acc = col;
        for (int i = 1; i < 10; i++) acc += texture2D(tDiffuse, uv - stepv * float(i)).rgb;
        col = mix(col, acc / 10.0, min(1.0, uDive * 1.4));
        col *= 1.0 - 0.35 * uDive * edge;
      }
      col += vec3(0.16, 0.42, 0.52) * frost * frost * 0.22;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function createFluid(renderer, { reducedMotion }) {
  const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
  let read = new THREE.WebGLRenderTarget(SIM, SIM, opts);
  let write = new THREE.WebGLRenderTarget(SIM, SIM, opts);
  const material = new THREE.ShaderMaterial({
    vertexShader: quadVert, fragmentShader: simFrag, depthTest: false, depthWrite: false,
    uniforms: {
      tVel: { value: null }, uFrom: { value: new THREE.Vector2() }, uTo: { value: new THREE.Vector2() },
      uForce: { value: new THREE.Vector2() }, uAspect: { value: 1 }, uRadius: { value: 0.0016 },
      uDt: { value: 0 }, uDecay: { value: 1 },
    },
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  const simScene = new THREE.Scene();
  simScene.add(quad);
  const cam = new THREE.Camera();

  // Pointer in uv space (y up). `moved` gates the splat so an idle cursor
  // adds nothing; the field just decays.
  const ptr = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, moved: false, seen: false };
  const onMove = (e) => {
    ptr.x = e.clientX / innerWidth;
    ptr.y = 1 - e.clientY / innerHeight;
    if (!ptr.seen) { ptr.px = ptr.x; ptr.py = ptr.y; ptr.seen = true; }
    ptr.moved = true;
  };
  addEventListener('pointermove', onMove, { passive: true });

  let last = 0;
  return {
    get texture() { return read.texture; },
    update(time) {
      const dt = last ? Math.min(0.05, Math.max(1e-3, time - last)) : 1 / 60;
      last = time;
      const u = material.uniforms;
      const splat = ptr.moved && !reducedMotion();
      u.uFrom.value.set(ptr.px, ptr.py);
      u.uTo.value.set(ptr.x, ptr.y);
      // Pointer velocity in uv/s, scaled so a brisk sweep reaches ~1–3.
      if (splat) u.uForce.value.set((ptr.x - ptr.px) / dt, (ptr.y - ptr.py) / dt).clampLength(0, 6).multiplyScalar(0.35);
      else u.uForce.value.set(0, 0);
      ptr.px = ptr.x; ptr.py = ptr.y; ptr.moved = false;
      u.uAspect.value = innerWidth / innerHeight;
      u.uDt.value = dt;
      u.uDecay.value = Math.exp(-dt * 1.8);
      u.tVel.value = read.texture;
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(write);
      renderer.render(simScene, cam);
      renderer.setRenderTarget(prev);
      [read, write] = [write, read];
    },
    dispose() {
      removeEventListener('pointermove', onMove);
      read.dispose(); write.dispose();
      material.dispose(); quad.geometry.dispose();
    },
  };
}
