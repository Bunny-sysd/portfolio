import * as THREE from 'three';
import { detectTier, TIER_SETTINGS } from '../tier.js';

// A plain probe canvas, never attached to the DOM or handed to THREE. THREE's
// own WebGLRenderer registers a 'webglcontextcreationerror' listener and logs
// via console.error asynchronously when context creation fails — that fires
// regardless of whether the constructor's own try/catch here catches the
// synchronous throw, so a disabled-WebGL environment would still spam the
// console even on the clean "return null" fallback path. A raw, un-trapped
// getContext() call on a throwaway canvas reports failure silently.
function supportsWebGL() {
  try {
    const probe = document.createElement('canvas');
    return !!(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
}

export function createStage(canvas) {
  if (!supportsWebGL()) return null;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  let gl, dbg, gpu;
  try {
    gl = renderer.getContext();
    dbg = gl.getExtension('WEBGL_debug_renderer_info');
    gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '';
  } catch {
    return null;
  }
  const tier = detectTier({
    gpu,
    memory: navigator.deviceMemory ?? 8,
    cores: navigator.hardwareConcurrency ?? 8,
    width: innerWidth,
    touch: matchMedia('(pointer: coarse)').matches,
  });
  const settings = TIER_SETTINGS[tier];
  // Shader error checking reads every program's info log on first use, which
  // forces a synchronous wait on the GPU process (~100–250 ms of main-thread
  // block on load, even after compileAsync). Keep it while developing only.
  renderer.debug.checkShaderErrors = import.meta.env.DEV;
  // Cap the device pixel ratio per tier (don't override it with a flat scale —
  // that rendered sub-native on high-DPR phones and blurred the card text).
  renderer.setPixelRatio(Math.max(1, Math.min(window.devicePixelRatio || 1, settings.dprCap)));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Additive particles stack past 1 at the core; neutral tone mapping rolls
  // that off instead of clipping channels.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 200);
  return { renderer, scene, camera, tier, settings };
}
