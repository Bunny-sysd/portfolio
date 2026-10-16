import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createFluid, FluidShader } from './fluid.js';

const FilmShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: 0.03 }, uVignette: { value: 0.32 } },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      vec2 c = vUv - 0.5;
      col *= 1.0 - uVignette * smoothstep(0.1, 0.55, dot(c, c));
      col += (hash(gl_FragCoord.xy + fract(uTime) * 97.0) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function createPost(renderer, scene, camera, { reducedMotion }) {
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  // Text is DOM, so nothing here can smear it; threshold keeps bloom to the
  // sun core and city lights; the lit cloud deck stays under the threshold.
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.45, 0.5, 1.6);
  composer.addPass(bloom);
  // Cursor fluid + frosted nav corner, after bloom so the glow is pushed
  // around with the rest of the frame.
  const fluid = createFluid(renderer, { reducedMotion });
  const fluidPass = new ShaderPass(FluidShader);
  // The frosted corner is sized for a desktop nav; on a phone it would wash
  // over the whole top of the screen, so it shrinks with the viewport.
  const sizeFrost = (w, h) => {
    fluidPass.uniforms.uResolution.value.set(w, h);
    fluidPass.uniforms.uFrostR.value = Math.min(420, 0.45 * Math.min(w, h));
  };
  sizeFrost(innerWidth, innerHeight);
  composer.addPass(fluidPass);
  // OutputPass (tonemap + linear->sRGB) runs before the film pass so grain is
  // added in display-referred (gamma) space, not scene-linear — additive
  // noise before the sRGB encode disproportionately amplifies in near-black
  // regions (e.g. night sky) after encoding, which made grain look like
  // flickering brightness there instead of even per-pixel grain.
  const output = new OutputPass();
  composer.addPass(output);
  const film = new ShaderPass(FilmShader);
  composer.addPass(film);
  // EffectComposer.dispose() only frees its own ping-pong render targets and
  // internal copyPass — it never touches composer.passes. Each pass owns GPU
  // resources of its own (UnrealBloomPass: several render targets + blur/
  // composite materials; ShaderPass/OutputPass: a material + fullscreen
  // quad), so they're disposed explicitly here or they leak once the fps
  // watchdog tears post FX down.
  const passes = [renderPass, bloom, fluidPass, output, film];
  return {
    render(time, { dive = 0, contact = 0 } = {}) {
      fluidPass.uniforms.uDive.value = dive;
      fluidPass.uniforms.uContact.value = contact;
      const t = reducedMotion() ? 0 : time;
      film.uniforms.uTime.value = t;
      fluid.update(time);
      fluidPass.uniforms.tVel.value = fluid.texture;
      fluidPass.uniforms.uTime.value = t;
      composer.render();
    },
    setSize(w, h) { composer.setSize(w, h); sizeFrost(w, h); },
    setPixelRatio(r) { composer.setPixelRatio(r); },
    dispose() {
      for (const pass of passes) pass.dispose();
      fluid.dispose();
      composer.dispose();
    },
  };
}
