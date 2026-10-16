import * as THREE from 'three';

// Defence in depth, made visible: hostile probes arc in from the forest
// towards the core and stop dead at a perimeter shell, which exists only where
// it's tested — each impact rings out across a faint lattice and fades. The
// probes are stateless (position is a closed-form function of time in the
// vertex shader); the CPU evaluates the same function to place the impacts.
const SHIELD_R = 4.2;
const TRAIL = 18;
const ACTIVE = 0.55; // share of each cycle spent in flight; the rest is the impact ring

const probeVert = /* glsl */`
  attribute vec3 aStart;
  attribute vec3 aCtrl;
  attribute vec3 aEnd;
  attribute vec3 aInfo;   // x: phase, y: cycles per second, z: trail position 0 (head) → 1
  uniform float uTime;
  uniform float uDPR;
  uniform float uFade;
  varying float vGlow;
  void main() {
    float cycle = fract(uTime * aInfo.y + aInfo.x);
    float t = cycle / ${ACTIVE.toFixed(2)} - aInfo.z * 0.12;
    float live = step(0.0, t) * step(t, 1.0);
    t = clamp(t, 0.0, 1.0);
    vec3 p = mix(mix(aStart, aCtrl, t), mix(aCtrl, aEnd, t), t);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float head = 1.0 - aInfo.z;
    vGlow = live * head * head * uFade * exp(-(-mv.z) * 0.02);
    gl_PointSize = live * mix(1.2, 3.4, head) * uDPR * clamp(18.0 / -mv.z, 0.6, 2.0);
  }`;

const probeFrag = /* glsl */`
  varying float vGlow;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = dot(c, c);
    if (r > 0.25 || vGlow < 0.004) discard;
    gl_FragColor = vec4(vec3(1.0, 0.42, 0.52) * vGlow * 1.6 * smoothstep(0.25, 0.0, r), 1.0);
    #include <colorspace_fragment>
  }`;

const shieldVert = /* glsl */`
  varying vec3 vDir;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    vDir = normalize(position);
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

const shieldFrag = /* glsl */`
  #define HITS 12
  uniform vec4 uHits[HITS];   // xyz: impact direction, w: age 0 → 1 (≥1 idle)
  uniform float uFade;
  uniform vec3 uTint;
  varying vec3 vDir;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    // A lat/long lattice, only ever lit near an impact.
    float lat = acos(clamp(vDir.y, -1.0, 1.0)) * 18.0 / 3.14159;
    float lon = atan(vDir.z, vDir.x) * 18.0 / 3.14159;
    vec2 g = abs(fract(vec2(lat, lon)) - 0.5);
    float lattice = smoothstep(0.08, 0.0, min(g.x, g.y));
    float lit = 0.0;
    for (int i = 0; i < HITS; i++) {
      vec4 h = uHits[i];
      if (h.w >= 1.0) continue;
      float d = distance(vDir, h.xyz);
      float fade = 1.0 - h.w;
      float ring = smoothstep(0.035, 0.0, abs(d - h.w * 0.42)) * fade * fade;
      float spot = exp(-d * d * 220.0) * fade * fade * 1.6;
      lit += ring * (0.25 + 0.75 * lattice) + spot + lattice * exp(-d * d * 40.0) * fade * 0.35;
    }
    float rim = pow(1.0 - abs(dot(vN, vView)), 4.0) * 0.035;
    vec3 col = mix(vec3(0.45, 0.85, 1.0), uTint, 0.55) * (lit * 0.45 + rim);
    gl_FragColor = vec4(col * uFade, 1.0);
    #include <colorspace_fragment>
  }`;

export function createPerimeter({ tier }) {
  const arcs = tier === 'low' ? 14 : 34;
  const rand = (() => { let s = 11; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
  const meta = [];
  const start = [], ctrl = [], end = [], info = [];
  for (let i = 0; i < arcs; i++) {
    const a = rand() * Math.PI * 2;
    const r = 14 + rand() * 18;
    const s = new THREE.Vector3(Math.cos(a) * r, 1 + rand() * 9, Math.sin(a) * r - 1.5);
    const dir = s.clone().add(new THREE.Vector3((rand() - 0.5) * 6, (rand() - 0.5) * 6, (rand() - 0.5) * 6)).normalize();
    const e = dir.clone().multiplyScalar(SHIELD_R);
    const c = s.clone().add(e).multiplyScalar(0.5).add(new THREE.Vector3(0, 3 + rand() * 4, 0));
    const phase = rand(), speed = 1 / (5 + rand() * 6);
    meta.push({ dir, phase, speed });
    for (let k = 0; k < TRAIL; k++) {
      start.push(s.x, s.y, s.z); ctrl.push(c.x, c.y, c.z); end.push(e.x, e.y, e.z);
      info.push(phase, speed, k / (TRAIL - 1));
    }
  }
  const geometry = new THREE.BufferGeometry();
  // position is unused by the shader but sizes the draw.
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(start, 3));
  geometry.setAttribute('aStart', new THREE.Float32BufferAttribute(start, 3));
  geometry.setAttribute('aCtrl', new THREE.Float32BufferAttribute(ctrl, 3));
  geometry.setAttribute('aEnd', new THREE.Float32BufferAttribute(end, 3));
  geometry.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 3));
  const probeMat = new THREE.ShaderMaterial({
    vertexShader: probeVert, fragmentShader: probeFrag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uDPR: { value: 1 }, uFade: { value: 1 } },
  });
  const probes = new THREE.Points(geometry, probeMat);
  probes.frustumCulled = false;

  const hits = Array.from({ length: 12 }, () => new THREE.Vector4(0, 1, 0, 1));
  const shieldGeo = new THREE.SphereGeometry(SHIELD_R, 64, 40);
  const shieldMat = new THREE.ShaderMaterial({
    vertexShader: shieldVert, fragmentShader: shieldFrag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uHits: { value: hits }, uFade: { value: 1 }, uTint: { value: new THREE.Color('#7dd3fc') } },
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.position.set(0, 0, 0);

  const group = new THREE.Group();
  group.add(probes, shield);
  const ages = [];
  return {
    group,
    // Count of probes stopped so far — the HUD's live tally.
    blocked: 0,
    update({ time, dpr, fade, tint }) {
      shieldMat.uniforms.uTint.value.copy(tint);
      probeMat.uniforms.uTime.value = time;
      probeMat.uniforms.uDPR.value = dpr;
      probeMat.uniforms.uFade.value = fade;
      shieldMat.uniforms.uFade.value = fade;
      // Same closed form as the shader: after its flight, each probe's cycle
      // spends the rest ringing on the shell.
      ages.length = 0;
      let total = 0;
      for (const m of meta) {
        const c = time * m.speed + m.phase;
        total += Math.floor(c - ACTIVE) + 1;
        const cycle = c - Math.floor(c);
        if (cycle >= ACTIVE) ages.push([m.dir, (cycle - ACTIVE) / (1 - ACTIVE)]);
      }
      this.blocked = Math.max(0, total);
      ages.sort((a, b) => a[1] - b[1]);
      hits.forEach((h, i) => {
        const a = ages[i];
        if (a) h.set(a[0].x, a[0].y, a[0].z, a[1]); else h.w = 1;
      });
    },
    dispose() { geometry.dispose(); probeMat.dispose(); shieldGeo.dispose(); shieldMat.dispose(); },
  };
}
