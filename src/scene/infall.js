import * as THREE from 'three';
import { RS, AXIS, E1, E2 } from './blackhole.js';

// Matter falling in. Each streak is a short line from a particle's position
// now to where it was a moment ago, on a spiral that tightens and speeds up
// (angular speed ∝ r^-1.5) as it sinks — so near the hole the streaks
// stretch out on their own, the way tidal forces spaghettify infalling gas.
// Closed-form in the vertex shader; it lands in the backdrop pass, so the
// black hole lenses it like everything else.
const vert = /* glsl */`
  attribute vec4 aSeed;   // x: start radius, y: start angle, z: period (s), w: 0 head / 1 tail
  uniform float uTime;
  uniform vec3 uAxis, uE1, uE2;
  varying float vGlow;
  varying float vHeat;
  vec3 at(float u, vec4 s) {
    float r = mix(s.x, ${(RS * 1.1).toFixed(3)}, pow(u, 1.8));
    float ang = s.y + 2.6 * u * pow(s.x / r, 1.5);
    float lift = sin(s.y * 7.0) * 0.35 * (r / s.x);
    return uE1 * cos(ang) * r + uE2 * sin(ang) * r + uAxis * lift;
  }
  void main() {
    float u = fract(uTime / aSeed.z + fract(aSeed.y * 3.7));
    // The tail trails by a fixed slice of time: fast inner orbits stretch it.
    float lag = 0.012;
    vec3 p = at(max(0.0, u - aSeed.w * lag), aSeed);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    float r = length(p);
    vHeat = smoothstep(${(RS * 8).toFixed(2)}, ${(RS * 2).toFixed(2)}, r);
    vGlow = (1.0 - aSeed.w) * smoothstep(0.0, 0.15, u) * smoothstep(${(RS * 1.1).toFixed(3)}, ${(RS * 2.4).toFixed(3)}, r);
  }`;

const frag = /* glsl */`
  uniform float uStrength;
  varying float vGlow;
  varying float vHeat;
  void main() {
    vec3 col = mix(vec3(0.45, 0.7, 0.95), vec3(1.0, 0.72, 0.42), vHeat);
    gl_FragColor = vec4(col * vGlow * uStrength, 1.0);
    #include <colorspace_fragment>
  }`;

export function createInfall({ tier }) {
  const n = tier === 'low' ? 220 : 600;
  const seeds = new Float32Array(n * 2 * 4);
  const pos = new Float32Array(n * 2 * 3);
  for (let i = 0; i < n; i++) {
    const s = [3.0 + Math.random() * 4.5, Math.random() * Math.PI * 2, 10 + Math.random() * 14];
    seeds.set([...s, 0, ...s, 1], i * 8);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  const material = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uAxis: { value: AXIS }, uE1: { value: E1 }, uE2: { value: E2 }, uStrength: { value: 0.3 } },
  });
  const lines = new THREE.LineSegments(geometry, material);
  lines.frustumCulled = false;
  return {
    object: lines,
    update({ time, fade }) { material.uniforms.uTime.value = time; material.uniforms.uStrength.value = 0.3 * fade; },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
