import * as THREE from 'three';

// The centrepiece: a particle core — a few breathing shells of points plus
// three tilted orbit bands, all moved in the vertex shader (no simulation
// texture), coloured from deep teal to warm gold. `uPulse` swells it when a
// view changes; `uFocus` pulls the cloud tighter while a project is open.
// Under reduced motion `uTime` is held, so it sits still but keeps its form.
const vert = /* glsl */`
  attribute vec4 aSeed;   // x,y,z: noise offsets; w: 0 shell, 1 orbit band
  uniform float uTime;
  uniform float uPulse;
  uniform float uFocus;
  uniform float uDPR;
  uniform vec3 uPointer;  // pointer ray hit on the core's plane, world space
  varying float vHeat;
  varying float vAlpha;

  vec3 hash3(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
  }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(dot(hash3(i), f), dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                   mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)), dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
               mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)), dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                   mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)), dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
  }

  void main() {
    vec3 p = position;
    float t = uTime;
    if (aSeed.w < 0.5) {
      // Shells breathe in and out along their normals with flowing noise.
      float n = noise(p * 1.4 + aSeed.xyz + vec3(0.0, t * 0.18, t * 0.11));
      p *= 1.0 + n * 0.22 + uPulse * 0.25;
      vHeat = smoothstep(-0.25, 0.35, n);
    } else {
      // Orbit bands: each point slides around its ring.
      float a = t * (0.12 + aSeed.x * 0.08);
      float c = cos(a), s = sin(a);
      p.xz = mat2(c, -s, s, c) * p.xz;
      p *= 1.0 + uPulse * 0.4;
      vHeat = 0.85;
    }
    p *= mix(1.0, 0.82, uFocus);
    // The pointer parts the cloud a little where it passes.
    vec3 d = p - uPointer;
    p += normalize(d + 1e-4) * 0.35 * exp(-dot(d, d) * 1.6);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = mix(2.0, 4.6, fract(aSeed.y * 13.7)) * (aSeed.w > 0.5 ? 0.8 : 1.0);
    gl_PointSize = size * uDPR * (6.0 / -mv.z);
    vAlpha = mix(0.35, 1.0, fract(aSeed.z * 7.3)) * smoothstep(40.0, 6.0, -mv.z);
  }`;

const frag = /* glsl */`
  uniform vec3 uCool;
  uniform vec3 uWarm;
  varying float vHeat;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = dot(c, c);
    if (r > 0.25) discard;
    float soft = smoothstep(0.25, 0.0, r);
    vec3 col = mix(uCool, uWarm, vHeat) * (0.6 + soft * 0.9);
    gl_FragColor = vec4(col * soft * vAlpha, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function createCore({ count = 60000, reducedMotion }) {
  const shells = Math.floor(count * 0.8);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    let x, y, z;
    if (i < shells) {
      // Fibonacci sphere, on one of four shells.
      const k = i % (shells / 4 | 0);
      const n = shells / 4;
      const yy = 1 - (k / (n - 1)) * 2;
      const rr = Math.sqrt(1 - yy * yy);
      const th = golden * k;
      const radius = [0.9, 1.35, 1.7, 2.05][(i / n) | 0] ?? 2.05;
      x = Math.cos(th) * rr * radius; y = yy * radius; z = Math.sin(th) * rr * radius;
    } else {
      // Three tilted orbit bands.
      const band = i % 3;
      const a = Math.random() * Math.PI * 2;
      const radius = 2.6 + band * 0.45 + (Math.random() - 0.5) * 0.12;
      const tilt = [0.35, -0.6, 1.1][band];
      x = Math.cos(a) * radius; y = (Math.random() - 0.5) * 0.05; z = Math.sin(a) * radius;
      const cy = Math.cos(tilt), sy = Math.sin(tilt);
      [y, z] = [y * cy - z * sy, y * sy + z * cy];
    }
    pos.set([x, y, z], i * 3);
    seed.set([Math.random() * 10, Math.random(), Math.random(), i < shells ? 0 : 1], i * 4);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const material = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uPulse: { value: 0 }, uFocus: { value: 0 }, uDPR: { value: 1 },
      uPointer: { value: new THREE.Vector3(99, 99, 99) },
      uCool: { value: new THREE.Color('#1aa6b7').multiplyScalar(1.1) },
      uWarm: { value: new THREE.Color('#f2b45a').multiplyScalar(1.3) },
    },
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return {
    object: points,
    update({ time, pulse, focus, dpr, pointer }) {
      const u = material.uniforms;
      u.uTime.value = reducedMotion() ? 0 : time;
      u.uPulse.value = pulse;
      u.uFocus.value = focus;
      u.uDPR.value = dpr;
      if (pointer) u.uPointer.value.copy(pointer);
      points.rotation.y = reducedMotion() ? 0 : time * 0.04;
    },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
