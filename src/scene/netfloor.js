import * as THREE from 'three';
import { d2xy } from '../hilbert.js';
import { FLOOR_Y } from './environment.js';
import { RS } from './blackhole.js';

// The address space, drawn on the water: one continuous order-7 Hilbert curve
// (16384 cells) — the layout IPv4 census maps and binary visualisers use, so
// neighbouring addresses stay neighbours. Scan packets run along it; a few
// segments burn warm, like high-entropy regions in a binvis map. In the work
// view the stretch round the core lights up: the part of the space in scope.
const ORDER = 128, CELL = 0.55;
// Space itself, curved: under the hole the address space sinks into a funnel
// — Flamm's paraboloid, z = √(8M(r − 2M)), the textbook embedding diagram of
// a Schwarzschild hole's equatorial space — measured down from its rim at
// WELL_R, so the floor is flat far out and plunges near the centre.
const WELL_R = 16, WELL_K = 0.9;
const flamm = (r) => Math.sqrt(4 * RS * Math.max(r - RS, 0)); // 8M = 4·rs
const well = (r) => (r >= WELL_R ? 0 : WELL_K * (flamm(WELL_R) - flamm(Math.max(r, RS * 1.5))));

const vert = /* glsl */`
  attribute float aT;
  varying float vT;
  varying vec3 vWorld;
  void main() {
    vT = aT;
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const frag = /* glsl */`
  uniform float uTime;
  uniform float uVault;
  uniform float uFade;
  uniform vec3 uTint;
  varying float vT;
  varying vec3 vWorld;
  float hash(float n) { return fract(sin(n * 91.345) * 47453.5453); }
  void main() {
    float dist = length(vWorld - cameraPosition);
    float fog = exp(-dist * 0.04);
    // Dim right under the camera, where it would sit beneath the copy.
    float near = smoothstep(5.0, 16.0, dist);
    // Scan packets: twelve heads with fading tails, crawling the curve.
    float s = fract(vT * 12.0 - uTime * 0.012);
    float packet = pow(s, 90.0) * 2.0 + smoothstep(0.998, 1.0, s) * 3.0;
    // High-entropy blocks (fixed per 16-cell run) burn amber.
    float block = floor(vT * 1024.0);
    float hot = step(0.93, hash(block));
    float r = length(vWorld.xz - vec2(0.0, -1.5));
    float scope = uVault * smoothstep(14.0, 8.0, r);
    vec3 base = mix(vec3(0.07, 0.30, 0.36), vec3(0.85, 0.52, 0.22), hot);
    vec3 col = mix(base, uTint * 0.45, scope * 0.6) * (0.22 + 1.1 * scope) + mix(vec3(0.55, 0.92, 1.0), uTint, 0.5) * packet;
    gl_FragColor = vec4(col * fog * near * uFade, 1.0);
    #include <colorspace_fragment>
  }`;

export function createNetFloor() {
  const n = ORDER * ORDER;
  const pos = new Float32Array(n * 3);
  const t = new Float32Array(n);
  const half = (ORDER - 1) * CELL / 2;
  for (let d = 0; d < n; d++) {
    const [x, y] = d2xy(ORDER, d);
    const px = x * CELL - half, pz = y * CELL - half - 1.5;
    pos.set([px, FLOOR_Y + 0.02 - well(Math.hypot(px, pz)), pz], d * 3);
    t[d] = d / (n - 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('aT', new THREE.BufferAttribute(t, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    // Drawn through the water: the funnel dips below the surface, like a
    // diagram projected into it.
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uVault: { value: 0 }, uFade: { value: 1 }, uTint: { value: new THREE.Color('#7dd3fc') } },
  });
  const line = new THREE.Line(geometry, material);
  line.frustumCulled = false;
  line.renderOrder = 1;
  return {
    object: line,
    update({ time, enter, tint }) {
      material.uniforms.uTime.value = time;
      material.uniforms.uTint.value.copy(tint);
      material.uniforms.uVault.value = enter;
    },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
