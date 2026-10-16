import * as THREE from 'three';
import { d2xy } from '../hilbert.js';
import { FLOOR_Y } from './environment.js';

// The horizon is a census map: a 256² order-8 Hilbert layout of an address
// space (each pixel a block, as in CAIDA's IPv4 census), allocated in
// CIDR-sized runs so it shows the real thing's squares and rectangles. A scan
// sweeps it in address order, so the lit edge crawls block by block rather
// than across the screen. Procedural — no data is claimed; it's a picture of
// how address space looks, not a picture of anyone's network.
const N = 256;

function buildTexture() {
  const data = new Uint8Array(N * N * 4);
  let s = 23;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  let d = 0;
  while (d < N * N) {
    // A CIDR-ish allocation: 4^k addresses, aligned.
    let k = 1 + Math.floor(rand() * 6);
    while (k > 0 && d % 4 ** k) k--;
    const size = Math.min(4 ** k, N * N - d);
    const empty = rand() < 0.38;
    const util = empty ? 0 : Math.pow(rand(), 0.7);
    for (let i = 0; i < size; i++, d++) {
      const [x, y] = d2xy(N, d);
      const o = (y * N + x) * 4;
      data[o] = Math.round(255 * util * (0.75 + 0.25 * rand()));
      data[o + 1] = d >> 8;   // Hilbert index, high byte
      data[o + 2] = d & 255;  // and low byte, for the address-order scan
      data[o + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

const vert = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const frag = /* glsl */`
  uniform sampler2D tMap;
  uniform float uTime;
  uniform float uStrength;
  uniform vec3 uTint;
  varying vec2 vUv;
  void main() {
    vec4 m = texture2D(tMap, vUv);
    float util = m.r;
    float d = (m.g * 255.0 * 256.0 + m.b * 255.0) / 65535.0;
    // Entropy-map palette: empty → deep blue → teal → warm.
    vec3 col = mix(vec3(0.0, 0.03, 0.08), vec3(0.03, 0.26, 0.34), smoothstep(0.0, 0.7, util));
    col = mix(col, vec3(0.75, 0.45, 0.2), smoothstep(0.8, 1.0, util));
    col *= step(0.02, util) * 0.3;
    // The scan front, in address order; blocks it has passed stay warm a while.
    float lag = fract(uTime * 0.018 - d);
    float scan = smoothstep(0.0, 0.002, lag) * exp(-lag * 70.0);
    col += uTint * scan * (0.3 + util) * 1.6;
    // Pixel gutters, so it reads as discrete blocks up close.
    vec2 g = abs(fract(vUv * ${N.toFixed(1)}) - 0.5);
    col *= 0.25 + 0.75 * smoothstep(0.5, 0.3, max(g.x, g.y));
    // Fade into the floor and out at the top and sides.
    float edge = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.55, vUv.y) * smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
    gl_FragColor = vec4(col * edge * uStrength, 1.0);
    #include <colorspace_fragment>
  }`;

export function createCensus() {
  const tex = buildTexture();
  const geometry = new THREE.PlaneGeometry(150, 150);
  const material = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { tMap: { value: tex }, uTime: { value: 0 }, uStrength: { value: 0.3 }, uTint: { value: new THREE.Color('#7dd3fc') } },
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, FLOOR_Y + 48, -120);
  mesh.renderOrder = -1;
  return {
    object: mesh,
    update({ time, enter, tint }) {
      material.uniforms.uTime.value = time;
      material.uniforms.uStrength.value = 0.3 + 0.15 * enter;
      material.uniforms.uTint.value.copy(tint);
    },
    dispose() { geometry.dispose(); material.dispose(); tex.dispose(); },
  };
}
