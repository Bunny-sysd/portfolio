import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

// The world around the core: a night "data forest" of particle server towers
// standing on dark reflective water, light shafts from above, and — faded in
// for the work view — a vault of glyph pillars and glowing floor rings around
// the card ring. Everything is procedural (no model files): points and two
// small custom shaders, fogged by distance into the background colour.
export const FLOOR_Y = -3.2;
const BG = new THREE.Color('#03060b');

const towerVert = /* glsl */`
  attribute vec4 aInfo;   // x: band phase, y: tower height, z: hot (amber) tower, w: 1 = vault pillar
  uniform float uTime;
  uniform float uDPR;
  uniform float uVault;   // 0 → 1 as the work view's vault fades in
  uniform float uForest;  // 1 → 0 as the forest gives way to the vault
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    // The hole's pull: towers lean in toward it, more with height and with
    // nearness (∝ 1/r²) — the whole forest is bent round the mass.
    vec3 p = position;
    float h = p.y - ${FLOOR_Y.toFixed(1)};
    vec2 toC = -p.xz;
    float rr = max(length(toC), 1.0);
    float lean = min(46.0 / (rr * rr), 1.6) * smoothstep(0.0, 22.0, h) * (h / 6.0);
    p.xz += toC / rr * min(lean, rr - 2.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    // Data flowing up each tower: a soft bright band climbing on a loop.
    float band = smoothstep(0.82, 1.0, fract(h / max(aInfo.y, 1.0) * 0.6 - uTime * 0.12 + aInfo.x));
    float rack = 0.35 + 0.65 * step(0.5, fract(h * 1.6 + aInfo.x * 7.0));
    vec3 cool = vec3(0.10, 0.62, 0.72), warm = vec3(0.95, 0.66, 0.30), glyph = vec3(0.55, 0.85, 1.0);
    vColor = mix(mix(cool, warm, aInfo.z), glyph, aInfo.w) * (0.9 * rack + band * 2.8);
    float fog = exp(-dist * mix(0.026, 0.02, aInfo.w));
    float show = aInfo.w > 0.5 ? uVault : uForest;
    // Fade out right at the floor so towers seem to stand in the water.
    vAlpha = fog * show * smoothstep(0.0, 0.6, h);
    // Sized for distance but never below ~1.5px, or far towers vanish.
    gl_PointSize = clamp((aInfo.w > 0.5 ? 2.6 : 2.2) * 34.0 / max(dist, 1.0), 1.5, 4.0) * uDPR;
  }`;

const towerFrag = /* glsl */`
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = dot(c, c);
    if (r > 0.25 || vAlpha < 0.003) discard;
    gl_FragColor = vec4(vColor * vAlpha * smoothstep(0.25, 0.0, r), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

function buildTowers(density) {
  const pos = [], info = [];
  const rand = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
  const pushTower = (x, z, w, d, height, hot, pillar) => {
    const phase = rand();
    const top = FLOOR_Y + height;
    const n = Math.floor(height * (pillar ? 60 : 34) * density);
    for (let i = 0; i < n; i++) {
      const y = FLOOR_Y + rand() * height;
      const r = rand();
      let px, pz;
      if (pillar) {
        // Pillars: dense vertical streams on a thin cylinder.
        const a = Math.floor(rand() * 10) / 10 * Math.PI * 2;
        px = x + Math.cos(a) * w; pz = z + Math.sin(a) * w;
      } else if (r < 0.55) {
        // Corner edges carry most points: reads as a rack's frame.
        px = x + (rand() < 0.5 ? -w : w); pz = z + (rand() < 0.5 ? -d : d);
      } else {
        // Faces: sparse, on horizontal rack rows.
        const face = rand() < 0.5;
        const yy = Math.round((y - FLOOR_Y) * 1.6) / 1.6 + FLOOR_Y;
        px = face ? x + (rand() * 2 - 1) * w : x + (rand() < 0.5 ? -w : w);
        pz = face ? z + (rand() < 0.5 ? -d : d) : z + (rand() * 2 - 1) * d;
        pos.push(px, Math.min(yy, top), pz); info.push(phase, height, hot, pillar ? 1 : 0);
        continue;
      }
      pos.push(px, y, pz); info.push(phase, height, hot, pillar ? 1 : 0);
    }
  };
  // Forest: a jittered grid, with a clearing round the core and a corridor
  // along +z that the camera flies down from home into the work view.
  for (let gx = -42; gx <= 42; gx += 3.4) {
    for (let gz = -48; gz <= 34; gz += 3.4) {
      const x = gx + (rand() - 0.5) * 1.6, z = gz + (rand() - 0.5) * 1.6;
      if (Math.hypot(x, z) < 10.5) continue;
      if (Math.abs(x) < 5.5 && z > 0) continue;
      if (rand() < 0.35) continue;
      const height = 5 + rand() * 15 + Math.max(0, -z) * 0.12;
      pushTower(x, z, 0.35 + rand() * 0.5, 0.35 + rand() * 0.5, height, rand() < 0.12 ? 1 : 0, false);
    }
  }
  // Vault: glyph pillars ringing the card orbit — behind and beside it only;
  // one in front would stand between the camera and the front card.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.26;
    const x = Math.cos(a) * 12.5, z = Math.sin(a) * 12.5 - 1.5;
    if (z > 1.5) continue;
    pushTower(x, z, 0.28, 0.28, 16, 0, true);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 4));
  return g;
}

// Water: the Reflector's mirror view, rippled, faded with distance and angle,
// with a fine grid and — for the vault — glowing rings round the core.
const WaterShader = {
  name: 'Water',
  uniforms: {
    color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
    uTime: { value: 0 }, uVault: { value: 0 }, uBg: { value: BG.clone() },
  },
  vertexShader: /* glsl */`
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVault;
    uniform vec3 uBg;
    varying vec4 vUv;
    varying vec3 vWorld;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
    void main() {
      // Space pulled in toward the hole: the survey grid and rings are drawn
      // in coordinates dragged inward near the centre.
      vec2 w = vWorld.xz;
      float rw = length(w);
      w -= w / max(rw, 1e-3) * 3.2 * exp(-rw / 5.0);
      vec2 ripple = vec2(noise(w * 0.9 + uTime * 0.25), noise(w * 0.9 - uTime * 0.2 + 4.0)) - 0.5;
      vec4 uv = vUv; uv.xy += ripple * uv.w * 0.008;
      vec3 refl = texture2DProj(tDiffuse, uv).rgb;
      float dist = length(vWorld - cameraPosition);
      float fade = exp(-dist * 0.035);
      // Calm, dark water: reflections strongest in the middle distance,
      // dimmed near the camera where they'd sit under the text.
      float near = smoothstep(4.0, 22.0, dist);
      vec3 col = uBg + refl * 0.32 * fade * mix(0.35, 1.0, near);
      // A faint survey grid on the water.
      vec2 gl = abs(fract(w / 2.0) - 0.5);
      col += vec3(0.05, 0.16, 0.2) * smoothstep(0.015, 0.0, min(gl.x, gl.y)) * fade * (0.18 + 0.32 * uVault);
      // Vault rings round the core.
      float r = length(w - vec2(0.0, -1.5));
      float rings = smoothstep(0.06, 0.0, abs(r - 7.5)) + smoothstep(0.04, 0.0, abs(r - 9.2)) * 0.7 + smoothstep(0.03, 0.0, abs(r - 12.5)) * 0.5;
      float pulse = 0.6 + 0.4 * sin(r * 2.0 - uTime * 1.5);
      col += vec3(0.25, 0.75, 0.9) * rings * pulse * uVault * fade;
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

// Light shafts: open cones with a soft vertical gradient, additive.
function buildShafts() {
  const group = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uStrength: { value: 1 } },
    vertexShader: /* glsl */`
      varying float vY; varying vec3 vN; varying vec3 vView;
      void main() { vY = uv.y; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vView = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      uniform float uStrength; varying float vY; varying vec3 vN; varying vec3 vView;
      void main() {
        float edge = pow(1.0 - abs(dot(vN, vView)), 2.0);
        float a = (1.0 - edge) * smoothstep(0.0, 0.6, vY) * smoothstep(1.0, 0.7, vY) * 0.05 * uStrength;
        gl_FragColor = vec4(vec3(0.45, 0.75, 0.85) * a, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  for (const [x, z, s] of [[-14, -18, 0.8], [17, -24, 0.7], [-22, 6, 0.6]]) {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.6 * s, 4.5 * s, 34, 32, 1, true), mat);
    cone.position.set(x, FLOOR_Y + 17, z);
    group.add(cone);
  }
  return { group, mat };
}

export function createEnvironment({ tier, reducedMotion }) {
  const group = new THREE.Group();
  const towers = new THREE.Points(buildTowers(tier === 'low' ? 0.45 : 1), new THREE.ShaderMaterial({
    vertexShader: towerVert, fragmentShader: towerFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uDPR: { value: 1 }, uVault: { value: 0 }, uForest: { value: 1 } },
  }));
  towers.frustumCulled = false;
  const scale = tier === 'high' ? 0.5 : 0.35;
  const water = new Reflector(new THREE.PlaneGeometry(160, 160), {
    shader: WaterShader, clipBias: 0.003, multisample: 0,
    textureWidth: Math.round(innerWidth * scale), textureHeight: Math.round(innerHeight * scale),
  });
  water.rotation.x = -Math.PI / 2;
  water.position.y = FLOOR_Y;
  const shafts = buildShafts();
  group.add(towers, water, shafts.group);

  return {
    group,
    water,
    update({ time, dpr, enter }) {
      const t = reducedMotion() ? 0 : time;
      const tu = towers.material.uniforms;
      tu.uTime.value = t; tu.uDPR.value = dpr;
      tu.uVault.value = enter;
      tu.uForest.value = 1 - 0.55 * enter;
      water.material.uniforms.uTime.value = t;
      water.material.uniforms.uVault.value = enter;
      shafts.mat.uniforms.uStrength.value = 1 - 0.4 * enter;
    },
    setSize(w, h) {
      water.getRenderTarget().setSize(Math.round(w * scale), Math.round(h * scale));
    },
    dispose() {
      towers.geometry.dispose(); towers.material.dispose();
      water.dispose();
      shafts.group.children.forEach((c) => c.geometry.dispose()); shafts.mat.dispose();
    },
  };
}
