import * as THREE from 'three';
import { cityReveal } from '../timeline.js';

const CITY_Y = -72;
const CELL = 14;
const PACKETS = 70;

const gridVertex = /* glsl */`
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const gridFragment = /* glsl */`
  uniform vec3 uLine;
  uniform vec3 uCam;
  uniform float uReveal;
  varying vec3 vWorld;
  void main() {
    vec2 g = vWorld.xz / ${CELL.toFixed(1)};
    vec2 w = fwidth(g);
    vec2 l = abs(fract(g - 0.5) - 0.5) / w;
    float line = 1.0 - min(min(l.x, l.y), 1.0);
    float dist = length(vWorld.xz - uCam.xz);
    float fade = 1.0 - smoothstep(120.0, 720.0, dist);
    gl_FragColor = vec4(uLine * line * fade * uReveal, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

const pointVertex = /* glsl */`
  attribute vec3 aColor;
  attribute float aSeed;
  uniform float uTime;
  uniform float uScale;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vColor = aColor;
    vTwinkle = 0.75 + 0.25 * sin(uTime * (1.5 + aSeed * 2.0) + aSeed * 40.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uScale * (2.0 + aSeed * 2.5) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const pointFragment = /* glsl */`
  uniform float uReveal;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * a * vTwinkle * uReveal * 1.6, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

function makePoints(count, colorFor) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const cyan = new THREE.Color('#7DD3FC');
  const warm = new THREE.Color('#FCD34D');
  for (let i = 0; i < count; i++) {
    pos[i * 3] = Math.round((Math.random() - 0.5) * 1000 / CELL) * CELL;
    pos[i * 3 + 1] = CITY_Y + 0.2;
    pos[i * 3 + 2] = Math.round((-Math.random() * 800 + 120) / CELL) * CELL;
    const c = colorFor(i, cyan, warm);
    col.set([c.r, c.g, c.b], i * 3);
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  return geo;
}

export function createCity(scene, { lights, reducedMotion }) {
  const gridUniforms = { uLine: { value: new THREE.Color('#7DD3FC').multiplyScalar(0.55) }, uCam: { value: new THREE.Vector3() }, uReveal: { value: 0 } };
  const grid = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 1600),
    new THREE.ShaderMaterial({ uniforms: gridUniforms, vertexShader: gridVertex, fragmentShader: gridFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = CITY_Y;
  scene.add(grid);

  const pointUniforms = { uTime: { value: 0 }, uScale: { value: 600 }, uReveal: { value: 0 } };
  const pointMaterial = new THREE.ShaderMaterial({ uniforms: pointUniforms, vertexShader: pointVertex, fragmentShader: pointFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const lightPoints = new THREE.Points(makePoints(lights, (i, cyan, warm) => (Math.random() < 0.15 ? warm : cyan)), pointMaterial);
  scene.add(lightPoints);

  // Packets: bright dots running along grid lines — traffic across the network.
  const packetGeo = makePoints(PACKETS, (i, cyan) => cyan);
  const packetPos = packetGeo.attributes.position;
  const packets = Array.from({ length: PACKETS }, () => ({ axis: Math.random() < 0.5 ? 0 : 2, speed: 20 + Math.random() * 45 }));
  const packetPoints = new THREE.Points(packetGeo, pointMaterial.clone());
  packetPoints.material.uniforms = { uTime: pointUniforms.uTime, uScale: { value: 900 }, uReveal: pointUniforms.uReveal };
  scene.add(packetPoints);

  let last = 0;
  return {
    update(p, time, camera) {
      const reveal = cityReveal(p);
      gridUniforms.uReveal.value = reveal;
      pointUniforms.uReveal.value = reveal;
      gridUniforms.uCam.value.copy(camera.position);
      const still = reducedMotion();
      pointUniforms.uTime.value = still ? 0 : time;
      const dt = Math.min(0.05, time - last);
      last = time;
      grid.visible = lightPoints.visible = packetPoints.visible = reveal > 0.001;
      if (still || reveal <= 0.001) return;
      for (let i = 0; i < PACKETS; i++) {
        const k = packets[i].axis;
        let v = packetPos.array[i * 3 + k] + packets[i].speed * dt;
        if (k === 0 && v > 500) v = -500;
        if (k === 2 && v > 120) v = -680;
        packetPos.array[i * 3 + k] = v;
      }
      packetPos.needsUpdate = true;
    },
    dispose() {
      for (const o of [grid, lightPoints, packetPoints]) { scene.remove(o); o.geometry.dispose(); o.material.dispose(); }
    },
  };
}
