import * as THREE from 'three';
import { detectTier, TIER_SETTINGS } from '../tier.js';

export function createStage(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  const gl = renderer.getContext();
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '';
  const tier = detectTier({
    gpu,
    memory: navigator.deviceMemory ?? 8,
    cores: navigator.hardwareConcurrency ?? 8,
    width: innerWidth,
  });
  const settings = TIER_SETTINGS[tier];
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, settings.dprCap));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(innerWidth < 768 ? 62 : 50, innerWidth / innerHeight, 0.1, 2000);
  return { renderer, scene, camera, tier, settings };
}
