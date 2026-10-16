import * as THREE from 'three';
import { HORIZON } from './blackhole.js';

// Hostile probes, sinkholed: they arc in from the forest and fall into the
// black hole at the centre — malicious traffic routed into a void, the way a
// DNS sinkhole swallows it. Stateless: each probe's position is a closed-form
// function of time in the vertex shader, and the CPU runs the same formula to
// count how many have gone in (the HUD's tally, labelled as a simulation).
const TRAIL = 18;
const ACTIVE = 0.6; // share of each cycle spent in flight; the rest is idle

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
    // Accelerating as they fall: time runs quadratically along the curve.
    t = clamp(t, 0.0, 1.0);
    float k = t * t;
    vec3 p = mix(mix(aStart, aCtrl, k), mix(aCtrl, aEnd, k), k);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float head = 1.0 - aInfo.z;
    // Dimming as they cross the horizon: nothing comes back out.
    float swallow = smoothstep(${(HORIZON * 0.8).toFixed(2)}, ${(HORIZON * 2.2).toFixed(2)}, length(p));
    vGlow = live * head * head * uFade * swallow * exp(-(-mv.z) * 0.02);
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

export function createPerimeter({ tier }) {
  const arcs = tier === 'low' ? 14 : 34;
  const rand = (() => { let s = 11; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
  const meta = [];
  const start = [], ctrl = [], end = [], info = [];
  for (let i = 0; i < arcs; i++) {
    const a = rand() * Math.PI * 2;
    const r = 14 + rand() * 18;
    const s = new THREE.Vector3(Math.cos(a) * r, 1 + rand() * 9, Math.sin(a) * r - 1.5);
    const e = new THREE.Vector3((rand() - 0.5) * 0.3, (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.3);
    // Swing the approach sideways so each falls in on a curve, not a line.
    const side = new THREE.Vector3(-s.z, 0, s.x).normalize().multiplyScalar((rand() - 0.5) * 14);
    const c = s.clone().multiplyScalar(0.35).add(side).add(new THREE.Vector3(0, 2 + rand() * 4, 0));
    const phase = rand(), speed = 1 / (5 + rand() * 6);
    meta.push({ phase, speed });
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
  const material = new THREE.ShaderMaterial({
    vertexShader: probeVert, fragmentShader: probeFrag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uDPR: { value: 1 }, uFade: { value: 1 } },
  });
  const probes = new THREE.Points(geometry, material);
  probes.frustumCulled = false;

  return {
    group: probes,
    // Probes swallowed so far — the HUD's live tally.
    blocked: 0,
    update({ time, dpr, fade }) {
      material.uniforms.uTime.value = time;
      material.uniforms.uDPR.value = dpr;
      material.uniforms.uFade.value = fade;
      let total = 0;
      for (const m of meta) total += Math.floor(time * m.speed + m.phase - ACTIVE) + 1;
      this.blocked = Math.max(0, total);
    },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
