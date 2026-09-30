import * as THREE from 'three';
import { altitudeAt, clamp01 } from '../timeline.js';

export function createCameraRig(camera, { reducedMotion }) {
  const pointer = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };
  const onMove = (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  const target = new THREE.Vector3();

  return {
    update(p) {
      const k = reducedMotion() ? 0 : 1;
      smooth.x += (pointer.x * k - smooth.x) * 0.05;
      smooth.y += (pointer.y * k - smooth.y) * 0.05;
      const y = altitudeAt(p);
      camera.position.set(smooth.x * 2.5, y - smooth.y * 1.2, 0);
      // Level with the horizon at the top; tilting down toward the city below.
      target.set(smooth.x * 6, y - (3 + 32 * clamp01(p)), -80);
      camera.lookAt(target);
    },
    dispose() {
      window.removeEventListener('pointermove', onMove);
    },
  };
}
