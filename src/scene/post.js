import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createFluid, FluidShader } from './fluid.js';

const FilmShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: 0.03 }, uVignette: { value: 0.32 }, uGlitch: { value: 0 } },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uGlitch;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      // Transition glitch: a few horizontal slices jump sideways and the
      // channels split, for a fraction of a second after a view change.
      vec2 uv = vUv;
      float g = uGlitch * uGlitch;
      float row = floor(uv.y * 36.0);
      float tick = floor(uTime * 24.0);
      float jump = step(0.82, hash(vec2(row, tick))) * (hash(vec2(tick, row)) - 0.5);
      uv.x += jump * 0.08 * g;
      float split = 0.007 * g;
      vec3 col = vec3(texture2D(tDiffuse, uv + vec2(split, 0.0)).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - vec2(split, 0.0)).b);
      vec2 c = vUv - 0.5;
      col *= 1.0 - uVignette * smoothstep(0.1, 0.55, dot(c, c));
      col += (hash(gl_FragCoord.xy + fract(uTime) * 97.0) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function createPost(renderer, scene, camera, { reducedMotion, contactFull = false }) {
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
  fluidPass.uniforms.uContactFull.value = contactFull ? 1 : 0;
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

  // Every material a pass owns (bloom keeps several, some in arrays).
  const materialsOf = (pass) => {
    const out = new Set();
    for (const v of Object.values(pass)) {
      if (v?.isMaterial) out.add(v);
      else if (Array.isArray(v)) v.forEach((m) => m?.isMaterial && out.add(m));
    }
    return [...out];
  };
  return {
    // Compile the post chain's programs off the main thread, as the scene's
    // are: left to its first frame, linking them synchronously blocked the
    // main thread for ~300 ms. Programs are keyed by render target, so all
    // but the last pass compile against a composer target and the final
    // (screen) pass against the canvas.
    precompile() {
      // Variants are also keyed by the geometry's attributes: the passes draw
      // with FullScreenQuad's position+uv triangle (no normals), the fluid sim
      // with its own plane — so each is compiled on a matching shape.
      const tri = new THREE.BufferGeometry();
      tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
      tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
      const plane = new THREE.PlaneGeometry(2, 2);
      const cam = new THREE.Camera();
      const sceneFor = (entries) => {
        const sc = new THREE.Scene();
        entries.forEach(([geo, m]) => { const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; sc.add(mesh); });
        return sc;
      };
      const offscreen = sceneFor([...[bloom, fluidPass, output].flatMap(materialsOf).map((m) => [tri, m]), [plane, fluid.material]]);
      const onscreen = sceneFor(materialsOf(film).map((m) => [tri, m]));
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(composer.renderTarget2);
      const a = renderer.compileAsync(offscreen, cam);
      renderer.setRenderTarget(null);
      const b = renderer.compileAsync(onscreen, cam);
      renderer.setRenderTarget(prev);
      return Promise.all([a, b]).finally(() => { tri.dispose(); plane.dispose(); });
    },
    // The scene's programs differ when drawn into the composer's (linear,
    // un-tonemapped) target rather than the screen; precompile against this.
    get sceneTarget() { return composer.renderTarget1; },
    fluidEnergy: () => fluid.energy(),
    render(time, { dive = 0, contact = 0, glitch = 0 } = {}) {
      film.uniforms.uGlitch.value = reducedMotion() ? 0 : glitch;
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
