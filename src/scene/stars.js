import * as THREE from 'three';

// A star field far behind everything. On its own it's a quiet sky; its real
// job is to show the lensing — near the hole stars smear into arcs, double up
// and crowd into an Einstein ring, which is most of what makes a black hole
// read as a mass rather than a black disc.
const vert = /* glsl */`
  attribute float aMag;
  uniform float uDPR;
  varying float vMag;
  void main() {
    vMag = aMag;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = mix(1.0, 2.6, aMag * aMag) * uDPR;
  }`;
const frag = /* glsl */`
  varying float vMag;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    vec3 col = mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.85, 0.7), fract(vMag * 13.0));
    gl_FragColor = vec4(col * (0.25 + vMag * vMag * 1.6), 1.0);
    #include <colorspace_fragment>
  }`;

export function createStars({ tier }) {
  const n = tier === 'low' ? 1500 : 4500;
  const pos = new Float32Array(n * 3), mag = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    // Upper hemisphere and a band above the horizon, well behind the forest.
    const th = Math.random() * Math.PI * 2;
    const y = Math.random() * 0.95 + 0.02;
    const r = Math.sqrt(1 - y * y) * 140;
    pos.set([Math.cos(th) * r, y * 140 - 8, Math.sin(th) * r], i * 3);
    mag[i] = Math.pow(Math.random(), 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aMag', new THREE.BufferAttribute(mag, 1));
  const m = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uDPR: { value: 1 } } });
  const points = new THREE.Points(g, m);
  points.frustumCulled = false;
  points.renderOrder = -2;
  return { object: points, update({ dpr }) { m.uniforms.uDPR.value = dpr; }, dispose() { g.dispose(); m.dispose(); } };
}
