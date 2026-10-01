import * as THREE from 'three';
import { CLOUD_LAYER_P, altitudeAt, paletteAt, smoothstep, cityReveal } from '../timeline.js';

// The whole backdrop — dusk sky, a stack of raymarched cumulus decks and the
// night city below — drawn as one full-screen pass. Rays come from the real
// THREE camera (camera.js), so pointer parallax and the descent path stay in
// one place. Shader space stretches the timeline's world — XZ × WORLD_XZ,
// altitude × WORLD_Y — so the decks become distinct strata with tall clear
// air between them (each chapter floats in one), and the hero looks down on a
// cloud sea from well above it rather than skimming the first deck.
const WORLD_XZ = 3;
const WORLD_Y = 8;
const DECK_HALF = 14;           // half-thickness of each deck, shader units
const GROUND = -75 * WORLD_Y;   // city plane, below the landing altitude
const COVERAGE = [0.0, 0.03, 0.06, 0.1, 0.16]; // lower decks get gappier so the city shows through
const STEPS = { high: 80, mid: 48, low: 28 };

// Deck centres sit on the camera's own path at each CLOUD_LAYER_P, so the
// camera punches through one between every chapter and every beat is in clear air.
export function deckCenters() {
  return CLOUD_LAYER_P.map((p) => altitudeAt(p) * WORLD_Y);
}

// How deep inside a deck the camera is (1 at its centre, 0 in clear air) —
// drives the DOM mist veil that softens each pass-through.
export function mistAt(cameraY) {
  const y = cameraY * WORLD_Y;
  let m = 0;
  for (const c of deckCenters()) m = Math.max(m, 1 - smoothstep(DECK_HALF * 0.4, DECK_HALF * 1.1, Math.abs(y - c)));
  return m;
}

const vertexShader = /* glsl */`
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const fragmentShader = /* glsl */`
  precision highp float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec3 uCamPos;
  uniform mat4 uCamWorld;
  uniform mat4 uInvProj;
  uniform vec3 uSunDir;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunCol;
  uniform float uNight;
  uniform float uDecks[5];
  uniform float uCover[5];
  uniform int uSteps;

  const float DECK_HALF = ${DECK_HALF.toFixed(1)};
  const float GROUND = ${GROUND.toFixed(1)};

  float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float noise2(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1,0)), f.x), mix(hash12(i + vec2(0,1)), hash12(i + vec2(1,1)), f.x), f.y);
  }
  float fbm(vec3 p, int oct) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { if (i >= oct) break; v += a * noise3(p); p = p * 2.02 + 7.3; a *= 0.5; }
    return v;
  }

  // Billow noise: creased, cauliflower-like lumps instead of smooth blobs.
  float billow(vec3 p) { return 1.0 - abs(noise3(p) * 2.0 - 1.0); }

  // One cumulus deck (centre c, extra coverage cover, seed k):
  // flat base, rounded tops, eroded edges.
  // Wind carries the decks along and the noise slowly evolves in y, so the
  // billows churn and reshape rather than sliding past as a rigid texture.
  // Where the march is fine enough to resolve it (fineW > 0, i.e. short
  // steps near the camera) a billow erosion pass bites into the thin edges:
  // creased rims and small curls, dense cores left intact. Coarse far steps
  // skip it — sampled every ~40 units it would only alias into streaks.
  float deckDensity(vec3 p, float c, float cover, float k, int oct, float fineW) {
    float h = (p.y - (c - DECK_HALF)) / (2.0 * DECK_HALF);
    if (h < 0.0 || h > 1.0) return 0.0;
    vec3 wind = vec3(uTime * 0.9, uTime * 0.12, uTime * 0.45);
    vec3 q = (p + wind) * 0.015 + vec3(k * 3.7, k * 1.9, 0.0);
    float base = fbm(q * vec3(1.0, 1.8, 1.0), oct);
    float cov = noise3(vec3(p.xz * 0.0025, 1.7 + k));
    float shape = smoothstep(0.0, 0.1, h) * smoothstep(1.0, 0.35 + 0.5 * cov, h);
    float d = (base - 0.40 - cover + cov * 0.12) * 5.6 * shape;
    if (d <= -0.4) return 0.0;
    vec3 e = (p + wind * 1.6) * 0.075;
    d -= (1.0 - fbm(e, 3)) * 0.35 * (1.0 - 0.6 * h);
    if (fineW > 0.0 && d > 0.0 && d < 0.7) {
      vec3 f = e * 2.7 + vec3(0.0, uTime * 0.05, 0.0);
      float fine = billow(f) * 0.62 + billow(f * 2.3 + 4.1) * 0.38;
      d -= (1.0 - fine) * 0.45 * (1.0 - d / 0.7) * fineW;
    }
    return clamp(d, 0.0, 1.0);
  }

  vec3 skyCol(vec3 rd) {
    float t = smoothstep(-0.05, 0.55, rd.y);
    vec3 col = mix(uHorizon, uZenith, t);
    col = mix(col, uHorizon * 0.45, smoothstep(0.0, -0.4, rd.y));
    float s = max(dot(rd, uSunDir), 0.0);
    col += uSunCol * (pow(s, 1100.0) * 9.0 + pow(s, 40.0) * 0.55 + pow(s, 6.0) * 0.18) * (1.0 - uNight);
    if (rd.y > 0.0) {
      vec2 g = floor(rd.xz / max(rd.y, 0.05) * 240.0);
      col += vec3(step(0.997, hash12(g)) * uNight * smoothstep(0.0, 0.3, rd.y));
    }
    return col;
  }

  float lightLayer(vec2 x, float cellSize, float keep, float t, out float warm) {
    vec2 g = x / cellSize;
    vec2 c = floor(g), f = fract(g);
    vec2 lp = vec2(hash12(c + 3.1), hash12(c + 7.7)) * 0.8 + 0.1;
    float on = step(1.0 - keep, hash12(c + 11.0));
    warm = step(0.35, hash12(c + 1.3));
    float r = 0.07 + t * 0.00003;
    return on * smoothstep(r, 0.0, length(f - lp));
  }

  // Night city: dense districts, dark parks, warped arterial roads.
  vec3 groundCol(vec3 ro, vec3 rd, float t, vec3 horizonFog) {
    vec2 x = (ro + rd * t).xz / ${WORLD_XZ.toFixed(1)};
    float dist = noise2(x * 0.004 + 4.0) * 0.7 + noise2(x * 0.011) * 0.3;
    float urban = smoothstep(0.38, 0.62, dist);
    // Streets: strongly domain-warped, rotated per district so there's no
    // global grid, and only lit where the district is urban.
    vec2 w = x + 70.0 * vec2(noise2(x * 0.004), noise2(x * 0.004 + 9.0));
    float ang = noise2(x * 0.0015 + 2.0) * 3.14159;
    w = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * w;
    float roadA = smoothstep(0.3, 0.0, abs(fract(w.x / 38.0) - 0.5) * 38.0);
    float roadB = smoothstep(0.3, 0.0, abs(fract(w.y / 53.0) - 0.5) * 53.0);
    float roads = max(roadA, roadB) * urban * 0.6;
    float wA, wB;
    float l1 = lightLayer(x, 2.3, 0.55 * urban + 0.04, t, wA);
    float l2 = lightLayer(x + 50.0, 5.1, 0.35 * urban, t, wB);
    vec3 sodium = vec3(1.0, 0.68, 0.32);
    vec3 cool = vec3(0.49, 0.83, 0.99);
    vec3 lights = l1 * mix(cool, sodium, wA) + l2 * 1.4 * mix(cool, sodium, wB) + roads * sodium * 0.55;
    vec3 col = vec3(0.012, 0.016, 0.03) + urban * vec3(0.03, 0.025, 0.035) + lights * 2.4 * uNight;
    return mix(col, horizonFog, 1.0 - exp(-t * 0.0015));
  }

  void main() {
    vec2 ndc = gl_FragCoord.xy / uRes * 2.0 - 1.0;
    vec4 view = uInvProj * vec4(ndc, 1.0, 1.0);
    vec3 rd = normalize((uCamWorld * vec4(normalize(view.xyz / view.w), 0.0)).xyz);
    vec3 ro = uCamPos;

    vec3 horizonFog = skyCol(normalize(vec3(rd.x, 0.0, rd.z)));
    float tg = (GROUND - ro.y) / rd.y;
    vec3 bg = (rd.y < 0.0 && tg > 0.0) ? groundCol(ro, rd, tg, horizonFog) : skyCol(rd);

    // March each deck's slab on its own, nearest first, so the step budget is
    // spent inside cloud rather than on the tall clear air between decks.
    vec4 acc = vec4(0.0);
    int perDeck = uSteps / 2;
    float jitter = hash12(gl_FragCoord.xy + fract(uTime));
    for (int s = 0; s < 5; s++) {
      if (acc.a > 0.97) break;
      int k = rd.y < 0.0 ? s : 4 - s;
      float c = uDecks[k];
      float lo = c - DECK_HALF, hi = c + DECK_HALF;
      float t0, t1;
      if (abs(rd.y) < 1e-4) {
        if (ro.y < lo || ro.y > hi) continue;
        t0 = 0.0; t1 = 1800.0;
      } else {
        float ta = (lo - ro.y) / rd.y, tb = (hi - ro.y) / rd.y;
        t0 = max(min(ta, tb), 0.0); t1 = min(max(ta, tb), 1800.0);
      }
      // Inside a deck, sideways rays would cross the whole slab; past a few
      // hundred units it's opaque fog anyway, so spend the steps up close.
      if (ro.y > lo && ro.y < hi) t1 = min(t1, 380.0);
      if (t1 <= t0) continue;
      float dt = max((t1 - t0) / float(perDeck), 0.8);
      float t = t0 + dt * jitter;
      for (int i = 0; i < 40; i++) {
        if (i >= perDeck || t > t1 || acc.a > 0.97) break;
        vec3 p = ro + rd * t;
        int oct = t < 200.0 ? 5 : 3;
        float den = deckDensity(p, c, uCover[k], float(k), oct, 1.0 - smoothstep(3.0, 9.0, dt));
        if (den > 0.01) {
          // Light march toward the sun with growing strides: near samples give
          // crisp self-shadowed crevices, far ones the deck's overall shade.
          // The second, weaker extinction fakes multiple scattering so shadowed
          // cores stay luminous instead of going grey.
          float sh = 0.0;
          for (int j = 1; j <= 5; j++) { float fj = float(j); sh += deckDensity(p + uSunDir * fj * fj * 1.6, c, uCover[k], float(k), 2, 0.0) * (0.6 + fj * 0.2); }
          float trans = max(exp(-sh * 1.9), exp(-sh * 0.45) * 0.35);
          float powder = 1.0 - exp(-den * 3.0);
          float hgt = clamp((p.y - lo) / (hi - lo), 0.0, 1.0);
          vec3 amb = mix(uZenith * 0.12, uZenith * 0.5 + uHorizon * 0.2, hgt * hgt);
          float forward = pow(max(dot(rd, uSunDir), 0.0), 24.0) * (1.0 - den);
          // At night the decks go to dark silhouettes, their bellies picking up
          // a faint sodium glow from the city below.
          vec3 col = amb * (1.0 - 0.75 * uNight) + uSunCol * trans * powder * (2.0 + forward * 1.5) * (1.0 - uNight * 0.96)
                   + vec3(1.0, 0.55, 0.25) * 0.05 * uNight * (1.0 - hgt) * powder;
          col = mix(col, horizonFog, 1.0 - exp(-t * 0.0006));
          float a = 1.0 - exp(-den * dt * 0.8);
          acc.rgb += (1.0 - acc.a) * a * col;
          acc.a += (1.0 - acc.a) * a;
        }
        t += dt;
      }
    }
    gl_FragColor = vec4(bg * (1.0 - acc.a) + acc.rgb, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function createVolume(scene, { tier, reducedMotion }) {
  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uCamPos: { value: new THREE.Vector3() },
    uCamWorld: { value: new THREE.Matrix4() },
    uInvProj: { value: new THREE.Matrix4() },
    uSunDir: { value: new THREE.Vector3() },
    uZenith: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uSunCol: { value: new THREE.Color(1.0, 0.62, 0.36) },
    uNight: { value: 0 },
    uDecks: { value: deckCenters() },
    uCover: { value: COVERAGE.slice() },
    uSteps: { value: STEPS[tier] ?? STEPS.mid },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader, fragmentShader, depthTest: false, depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  scene.add(mesh);
  const size = new THREE.Vector2();

  return {
    update(p, time, camera, renderer) {
      renderer.getDrawingBufferSize(size);
      uniforms.uRes.value.copy(size);
      uniforms.uTime.value = reducedMotion() ? 0 : time;
      uniforms.uCamPos.value.set(camera.position.x * WORLD_XZ, camera.position.y * WORLD_Y, camera.position.z * WORLD_XZ);
      uniforms.uCamWorld.value.copy(camera.matrixWorld);
      uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);
      const { zenith, horizon } = paletteAt(p);
      uniforms.uZenith.value.setRGB(zenith[0], zenith[1], zenith[2], THREE.SRGBColorSpace);
      uniforms.uHorizon.value.setRGB(horizon[0], horizon[1], horizon[2], THREE.SRGBColorSpace);
      const sunEl = THREE.MathUtils.lerp(0.13, -0.12, smoothstep(0.15, 0.7, p));
      uniforms.uSunDir.value.set(0.25, sunEl, -1).normalize();
      uniforms.uNight.value = Math.max(smoothstep(0.45, 0.85, p), cityReveal(p));
    },
    // Watchdog's last notch: fewer march steps.
    reduceSteps() { uniforms.uSteps.value = STEPS.low; },
    dispose() {
      scene.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
