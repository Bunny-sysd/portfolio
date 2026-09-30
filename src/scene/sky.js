import * as THREE from 'three';
import { paletteAt, smoothstep } from '../timeline.js';

export function createSky(scene) {
  const uniforms = {
    uZenith: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0.35, 0.06, -1).normalize() },
    uSun: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uSunDir;
      uniform float uSun;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 col = mix(uHorizon, uZenith, smoothstep(-0.02, 0.55, d.y));
        col = mix(col, uHorizon * 0.5, smoothstep(0.0, -0.45, d.y));
        float s = max(dot(d, uSunDir), 0.0);
        col += vec3(1.0, 0.72, 0.45) * (pow(s, 900.0) * 6.0 + pow(s, 14.0) * 0.35) * uSun;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  scene.add(mesh);

  const colors = { zenith: uniforms.uZenith.value, horizon: uniforms.uHorizon.value };
  return {
    colors,
    update(p, camera) {
      const { zenith, horizon } = paletteAt(p);
      colors.zenith.setRGB(zenith[0], zenith[1], zenith[2], THREE.SRGBColorSpace);
      colors.horizon.setRGB(horizon[0], horizon[1], horizon[2], THREE.SRGBColorSpace);
      uniforms.uSun.value = 1 - smoothstep(0.22, 0.55, p);
      mesh.position.copy(camera.position);
    },
    dispose() {
      scene.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
