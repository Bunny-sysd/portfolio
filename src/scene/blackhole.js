import * as THREE from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

// The centre of the world is a sinkhole — the security kind (malicious
// traffic routed into a void) drawn as the physics kind: a Schwarzschild
// black hole, ray-traced per pixel.
//
// How it's drawn:
//  1. The backdrop pass (scene minus cards and hole) is rendered by world.js.
//  2. Here, a camera-facing disc round the hole traces a light ray per pixel
//     through curved space (photon orbit equation, a = -1.5·rs·h²·p / r⁵),
//     collecting a volumetric accretion disk wherever the ray crosses its
//     plane, and — if the ray escapes — sampling the backdrop in the
//     direction it escaped. That result lands in `target` (backdrop + hole).
//  3. In the main pass the disc just blits `target`; it's opaque and
//     depth-writing at the hole's plane, so cards and near towers still draw
//     over it. The glass cards refract `target`, so they see the hole too.
//
// The disk: temperature from the thin-disk profile T ∝ r^-¾ (1 - √(rin/r))^¼,
// coloured as a blackbody, Doppler-shifted (approaching side bluer and much
// brighter, ∝ g³) and gravitationally redshifted (√(1 - rs/r)); inner edge at
// the innermost stable orbit (3 rs); gas shears Keplerian-fast inward.
export const RS = 0.55;          // Schwarzschild radius (world units)
export const HORIZON = RS * 2.6; // apparent shadow radius, ≈ 2.6 rs
// The disk's frame, shared with the infalling matter (infall.js).
export const AXIS = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(0.34, 0, -0.12)).normalize();
export const E1 = new THREE.Vector3(1, 0, 0).projectOnPlane(AXIS).normalize();
export const E2 = new THREE.Vector3().crossVectors(AXIS, E1).normalize();
const BOUND = 9.0;               // ray-traced sphere round the hole
const LENS_R = 12.0;             // world radius of the drawn disc
const R_IN = RS * 3.0, R_OUT = 4.4;

const vert = /* glsl */`
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

const traceFrag = (steps, octaves) => /* glsl */`
  #define STEPS ${steps}
  #define OCTAVES ${octaves}
  #define THICK(r) (0.03 + 0.06 * (r))
  #define STEP_K ${steps < 64 ? '0.15' : '0.085'}
  uniform sampler2D tBg;
  uniform mat4 uViewProj;
  uniform vec2 uRes;       // target size, px
  uniform vec2 uScreenC;   // hole centre in target px
  uniform float uScreenR;  // disc radius in target px
  uniform vec3 uC;
  uniform vec3 uAxis, uE1, uE2;
  uniform float uTime;
  uniform float uGlow;
  varying vec3 vWorld;

  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < OCTAVES; i++) { s += a * noise(p); p = p * 2.07 + 13.1; a *= 0.5; } return s; }

  // Blackbody colour for a temperature in kelvin (fit to the Planck locus).
  vec3 blackbody(float T) {
    float t = T / 100.0;
    float r = t <= 66.0 ? 1.0 : clamp(1.2929 * pow(t - 60.0, -0.1332), 0.0, 1.0);
    float g = t <= 66.0 ? clamp(0.3901 * log(t) - 0.6318, 0.0, 1.0) : clamp(1.1299 * pow(t - 60.0, -0.0755), 0.0, 1.0);
    float b = t >= 66.0 ? 1.0 : (t <= 19.0 ? 0.0 : clamp(0.5432 * log(t - 10.0) - 1.1963, 0.0, 1.0));
    return vec3(r, g, b);
  }

  // Emission and opacity of the disk where the ray crosses its plane at q,
  // travelling along v (the photon itself runs the other way, to the camera).
  vec4 disk(vec3 q, vec3 v) {
    vec2 pl = vec2(dot(q, uE1), dot(q, uE2));
    float r = length(pl);
    if (r < ${R_IN.toFixed(3)} * 0.9 || r > ${R_OUT.toFixed(1)}) return vec4(0.0);
    float x = r / ${R_IN.toFixed(3)};
    // Keplerian: inner gas laps outer gas, so turbulence shears into arcs.
    float w = 1.9 / pow(x, 1.5);
    float ang = atan(pl.y, pl.x) + uTime * w;
    vec3 nc = vec3(cos(ang) * 1.6, sin(ang) * 1.6, log(r) * 9.0);
    float gas = fbm(nc + vec3(0.0, 0.0, uTime * 0.05));
    float fine = fbm(nc * vec3(2.0, 2.0, 2.6) + 7.0);
    float dens = smoothstep(0.9, 1.15, x) * smoothstep(${R_OUT.toFixed(1)}, ${(R_OUT * 0.55).toFixed(2)}, r);
    dens *= 0.35 + 1.25 * gas * (0.55 + 0.6 * fine);
    // Thin-disk temperature, then Doppler and gravitational shifts.
    // Peaks near 5000 K (amber-white); beaming pushes the near side hotter.
    float T = 11500.0 * pow(x, -0.75) * pow(max(1.0 - sqrt(1.0 / x), 0.0), 0.25);
    vec3 tangent = normalize(cross(uAxis, q));
    float beta = clamp(sqrt(${RS.toFixed(3)} / (2.0 * r)), 0.0, 0.7);
    float gamma = inversesqrt(1.0 - beta * beta);
    float dopp = 1.0 / (gamma * (1.0 - beta * dot(tangent, -normalize(v))));
    float grav = sqrt(max(1.0 - ${RS.toFixed(3)} / r, 0.0));
    float g = dopp * grav;
    float Tobs = T * g;
    float I = min(pow(g, 3.0) * pow(Tobs / 6000.0, 2.0) * 0.8, 1.6);
    vec3 col = blackbody(Tobs) * I * dens;
    return vec4(col, clamp(dens * 0.95, 0.0, 1.0));
  }

  void main() {
    vec2 sc = gl_FragCoord.xy - uScreenC;
    float sr = length(sc);
    if (sr > uScreenR) discard;
    vec3 ro = cameraPosition - uC;
    vec3 rd = normalize(vWorld - cameraPosition);
    vec3 col = vec3(0.0);
    float trans = 1.0;
    bool absorbed = false;
    vec3 dir = rd;
    // Only trace inside the bounding sphere; straight lines outside it.
    float b = dot(ro, rd), c = dot(ro, ro) - ${(BOUND * BOUND).toFixed(1)};
    float disc = b * b - c;
    if (disc > 0.0 && -b + sqrt(disc) > 0.0) {
      vec3 p = ro + rd * max(0.0, -b - sqrt(disc));
      vec3 v = rd;
      vec3 hv = cross(p, v);
      float h2 = dot(hv, hv);
      for (int i = 0; i < STEPS; i++) {
        float r2 = dot(p, p);
        float r = sqrt(r2);
        if (r < ${RS.toFixed(3)}) { absorbed = true; break; }
        if (r > ${(BOUND + 0.05).toFixed(2)} && dot(p, v) > 0.0) break;
        // Small steps near the hole, long ones far out — and never a step
        // that could jump over the disk's slab: within reach of it, the step
        // is capped at the distance to its surface (plus a fraction inside).
        float dt = clamp(STEP_K * (r - ${RS.toFixed(3)} * 0.6), 0.012, 0.6);
        float hh = dot(p, uAxis);
        float rq = length(p - uAxis * hh);
        float Hq = THICK(rq);
        if (rq < ${(R_OUT * 1.08).toFixed(2)}) dt = min(dt, max(abs(hh) - 3.0 * Hq, 0.0) + max(Hq * 0.45, 0.012));
        vec3 a = -1.5 * ${RS.toFixed(3)} * h2 * p / (r2 * r2 * r);
        vec3 pn = p + v * dt + 0.5 * a * dt * dt;
        v += a * dt;
        // A volume, not a sheet: gas fills a slab that flares with radius,
        // densest at the midplane (Gaussian profile). Light is gathered along
        // the path through it, so grazing views glow thicker at the limb.
        float hgt = dot(pn, uAxis);
        vec3 pp = pn - uAxis * hgt;
        float H = THICK(length(pp));
        if (abs(hgt) < 3.0 * H) {
          vec4 e = disk(pp, v);
          float prof = exp(-hgt * hgt / (H * H));
          float k = dt / (2.0 * H) * 0.62;
          col += trans * e.rgb * prof * k;
          trans *= 1.0 - clamp(e.a * prof * k, 0.0, 1.0);
          if (trans < 0.02) break;
        }
        p = pn;
      }
      dir = normalize(v);
    }
    vec3 bg = vec3(0.0);
    if (!absorbed) {
      // Where the ray ends up, seen as a point far behind along its exit
      // direction, read from the backdrop. Eased to the unbent frame at the
      // rim so the disc meets the scene round it without a seam.
      vec4 clip = uViewProj * vec4(cameraPosition + dir * (length(ro) + 30.0), 1.0);
      vec2 bent = clip.w > 0.0 ? clip.xy / clip.w * 0.5 + 0.5 : gl_FragCoord.xy / uRes;
      float k = smoothstep(uScreenR, uScreenR * 0.2, sr);
      vec2 uv = mix(gl_FragCoord.xy / uRes, bent, k * k);
      bg = texture2D(tBg, clamp(uv, vec2(0.001), vec2(0.999))).rgb;
    }
    // Highlight compression on the disk's own light, so the beamed near side
    // keeps its gas lanes instead of clipping to a white blob.
    col *= uGlow;
    col = col / (1.0 + max(max(col.r, col.g), col.b) * 0.55);
    gl_FragColor = vec4(col + trans * bg, 1.0);
  }`;

const blitFrag = /* glsl */`
  uniform sampler2D tHole;
  uniform vec2 uRes;
  uniform vec2 uScreenC;
  uniform float uScreenR;
  void main() {
    if (length(gl_FragCoord.xy - uScreenC) > uScreenR) discard;
    gl_FragColor = vec4(texture2D(tHole, gl_FragCoord.xy / uRes).rgb, 1.0);
    #include <colorspace_fragment>
  }`;

const copyMat = new THREE.ShaderMaterial({
  uniforms: { tSrc: { value: null } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: 'uniform sampler2D tSrc; varying vec2 vUv; void main() { gl_FragColor = texture2D(tSrc, vUv); }',
  depthTest: false, depthWrite: false,
});

export function createBlackHole({ tier, reducedMotion }) {
  const axis = AXIS, e1 = E1, e2 = E2;
  const geometry = new THREE.PlaneGeometry(2 * LENS_R, 2 * LENS_R);
  // Weak devices trace fewer, longer steps with simpler gas.
  const steps = tier === 'low' ? 56 : tier === 'mid' ? 170 : 260;
  const octaves = tier === 'low' ? 3 : 5;
  // …and at half the backdrop's resolution (the disk is soft anyway).
  const traceScale = tier === 'low' ? 0.5 : 1;
  const trace = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: traceFrag(steps, octaves), depthTest: false, depthWrite: false,
    uniforms: {
      tBg: { value: null }, uViewProj: { value: new THREE.Matrix4() }, uRes: { value: new THREE.Vector2(1, 1) },
      uScreenC: { value: new THREE.Vector2() }, uScreenR: { value: 1 }, uC: { value: new THREE.Vector3() },
      uAxis: { value: axis }, uE1: { value: e1 }, uE2: { value: e2 }, uTime: { value: 0 }, uGlow: { value: 1 },
    },
  });
  const blit = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: blitFrag,
    // Drawn after the water and over it (the bent image already contains
    // the floor), but still writing depth so towers behind the hole are
    // hidden and those in front draw over.
    depthTest: false,
    uniforms: { tHole: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uScreenC: { value: new THREE.Vector2() }, uScreenR: { value: 1 } },
  });
  // The visible disc in the main scene (blit), and its twin in a scene of its
  // own that does the tracing into `target`.
  const lens = new THREE.Mesh(geometry, blit);
  lens.frustumCulled = false;
  lens.renderOrder = 1;
  const tracer = new THREE.Mesh(geometry, trace);
  tracer.frustumCulled = false;
  const traceScene = new THREE.Scene();
  traceScene.add(tracer);
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  blit.uniforms.tHole.value = target.texture;
  const copy = new FullScreenQuad(copyMat);

  const c = new THREE.Vector3(), e = new THREE.Vector3(), right = new THREE.Vector3();
  const project = (v, camera, w, h) => { v.project(camera); return [(v.x * 0.5 + 0.5) * w, (v.y * 0.5 + 0.5) * h]; };
  // Centre and disc radius of the hole on a w×h surface.
  const onScreen = (camera, w, h) => {
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    const [cx, cy] = project(e.copy(c), camera, w, h);
    const [lx] = project(e.copy(c).addScaledVector(right, LENS_R), camera, w, h);
    return [cx, cy, Math.abs(lx - cx)];
  };
  return {
    group: lens,
    lens,
    target,
    screen: { x: -1e4, y: -1e4, r: 0 },
    // Drawn-at-hole scene objects (the plane faces the camera); `glow` and
    // `time` drive the disk.
    update({ time, camera, res, pulse, focus }) {
      lens.getWorldPosition(c);
      lens.quaternion.copy(camera.quaternion);
      tracer.position.copy(lens.position);
      tracer.quaternion.copy(camera.quaternion);
      tracer.updateMatrixWorld();
      const [cx, cy, cr] = onScreen(camera, res.x, res.y);
      // In CSS px, for DOM effects (the probe feels the pull).
      this.screen.x = cx / res.x * innerWidth;
      this.screen.y = innerHeight - cy / res.y * innerHeight;
      this.screen.r = cr / res.x * innerWidth * (HORIZON / LENS_R);
      blit.uniforms.uRes.value.copy(res);
      blit.uniforms.uScreenC.value.set(cx, cy);
      blit.uniforms.uScreenR.value = cr;
      const u = trace.uniforms;
      u.uC.value.copy(c);
      u.uTime.value = reducedMotion() ? 0 : time;
      u.uGlow.value = (1 + pulse * 0.6) * (1 - 0.35 * focus);
      u.uViewProj.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    },
    // backdrop → target, with the hole traced into it.
    render(renderer, camera, backdrop) {
      const tw = Math.max(1, Math.round(backdrop.width * traceScale)), th = Math.max(1, Math.round(backdrop.height * traceScale));
      if (target.width !== tw || target.height !== th) target.setSize(tw, th);
      const u = trace.uniforms;
      u.tBg.value = backdrop.texture;
      u.uRes.value.set(target.width, target.height);
      const [cx, cy, cr] = onScreen(camera, target.width, target.height);
      u.uScreenC.value.set(cx, cy);
      u.uScreenR.value = cr;
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(target);
      copyMat.uniforms.tSrc.value = backdrop.texture;
      copy.render(renderer);
      const auto = renderer.autoClear;
      renderer.autoClear = false;
      renderer.render(traceScene, camera);
      renderer.autoClear = auto;
      renderer.setRenderTarget(prev);
    },
    // For the async precompile: the tracer lives outside the main scene.
    traceScene,
    dispose() { geometry.dispose(); trace.dispose(); blit.dispose(); target.dispose(); copy.dispose(); },
  };
}
