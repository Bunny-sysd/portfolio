import * as THREE from 'three';
import { CLOUD_LAYER_P, altitudeAt, smoothstep } from '../timeline.js';

const COVERAGE = [0.42, 0.48, 0.5, 0.54, 0.62]; // higher = gappier; the lowest layer lets the city through
const SHEET_OFFSETS = [0, 1.6, -1.6];
const MIST_RADIUS = 3.5;

const vertexShader = /* glsl */`
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform float uCoverage;
  uniform float uSeed;
  uniform vec3 uLit;
  uniform vec3 uShade;
  uniform vec3 uFog;
  uniform vec3 uCam;
  varying vec3 vWorld;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vWorld.xz * 0.02 + vec2(uSeed, uSeed * 1.7) + vec2(uTime * 0.004, uTime * 0.0015);
    float n = fbm(uv);
    float a = smoothstep(uCoverage, uCoverage + 0.22, n);
    float dist = length(vWorld.xz - uCam.xz);
    a *= 1.0 - smoothstep(380.0, 680.0, dist);                   // soften the sheet's far edge
    a *= smoothstep(0.8, 2.6, abs(uCam.y - vWorld.y));           // DOM mist takes over up close
    vec3 col = mix(uShade, uLit, smoothstep(uCoverage, uCoverage + 0.5, n));
    col = mix(col, uFog, 1.0 - exp(-dist * 0.0022));
    gl_FragColor = vec4(col, a * 0.92);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function createClouds(scene, { sheetsPerLayer, reducedMotion }) {
  const geometry = new THREE.PlaneGeometry(1400, 1400);
  const layers = CLOUD_LAYER_P.map((lp, li) => ({ y: altitudeAt(lp), coverage: COVERAGE[li] }));
  const sheets = [];
  const shared = { uLit: new THREE.Color(), uShade: new THREE.Color(), uFog: new THREE.Color(), uCam: new THREE.Vector3() };

  const perLayer = Math.min(sheetsPerLayer, SHEET_OFFSETS.length);
  layers.forEach((layer, li) => {
    for (let s = 0; s < perLayer; s++) {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uCoverage: { value: layer.coverage + s * 0.03 },
          uSeed: { value: li * 7.13 + s * 3.31 },
          uLit: { value: shared.uLit },
          uShade: { value: shared.uShade },
          uFog: { value: shared.uFog },
          uCam: { value: shared.uCam },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = layer.y + SHEET_OFFSETS[s];
      mesh.userData.sheet = s;
      scene.add(mesh);
      sheets.push(mesh);
    }
  });

  const white = new THREE.Color(1, 1, 1);
  return {
    update(p, time, camera, colors) {
      // Sunlit tops at dusk; by night the clouds are only lit by the sky around them.
      shared.uLit.copy(colors.horizon).lerp(white, 0.1 + 0.35 * (1 - smoothstep(0.55, 0.95, p)));
      shared.uShade.copy(colors.zenith).lerp(colors.horizon, 0.35).multiplyScalar(0.7);
      shared.uFog.copy(colors.horizon);
      shared.uCam.copy(camera.position);
      const t = reducedMotion() ? 0 : time;
      for (const m of sheets) {
        m.material.uniforms.uTime.value = t;
        m.position.x = camera.position.x;   // sheets follow the camera sideways so edges never show
      }
      let mist = 0;
      for (const layer of layers) mist = Math.max(mist, 1 - smoothstep(0, MIST_RADIUS, Math.abs(camera.position.y - layer.y)));
      return mist;
    },
    // FPS watchdog's last notch: hide all but the first n sheets of each layer.
    setSheetsPerLayer(n) {
      for (const m of sheets) m.visible = m.userData.sheet < n;
    },
    dispose() {
      for (const m of sheets) { scene.remove(m); m.material.dispose(); }
      geometry.dispose();
    },
  };
}
