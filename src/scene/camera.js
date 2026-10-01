import * as THREE from 'three';
import { altitudeAt, clamp01 } from '../timeline.js';

const FORWARD = 450; // world units travelled forward over the whole scroll
const CRUISE = 1.6;  // world units/s the camera keeps gliding forward on its own
const DIVE = 26;     // world units the camera plunges forward when a case study opens

// The camera is a film camera on a plane, not a scroll readout: it keeps
// cruising forward and gently banking even at rest, widens a little with
// scroll speed, and dives forward into the cloud when a case study opens.
// Under reduced motion only the scroll-driven path remains.
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
    // p: eased film progress; time: seconds; speed: 0–1 scroll rush; dive: 0–1.
    update(p, { time = 0, speed = 0, dive = 0 } = {}) {
      const k = reducedMotion() ? 0 : 1;
      smooth.x += (pointer.x * k - smooth.x) * 0.05;
      smooth.y += (pointer.y * k - smooth.y) * 0.05;
      const t = time * k;
      const d = dive * k;
      const y = altitudeAt(p);
      // Fly forward the whole film while descending — the forward rush is
      // what makes cloud banks stream past instead of just rising.
      const z = -FORWARD * clamp01(p) - CRUISE * t - DIVE * d * d * (3 - 2 * d);
      const sway = Math.sin(t * 0.21) * 0.9 + Math.sin(t * 0.53) * 0.25;
      const bob = Math.sin(t * 0.33) * 0.3;
      camera.position.set(smooth.x * 2.5 + sway, y - smooth.y * 1.2 + bob, z);
      // Level with the horizon at the top; tilting down toward the city below.
      target.set(smooth.x * 6 + sway * 0.6, y - (3 + 32 * clamp01(p)) - d * 6, z - 80);
      camera.lookAt(target);
      // A slow bank, leaning into pointer moves like a plane turning.
      camera.rotateZ((Math.sin(t * 0.17) * 0.014 - smooth.x * 0.03) * (k ? 1 : 0));
      const fov = (innerWidth < 768 ? 62 : 50) + 9 * speed * k - 12 * d;
      if (Math.abs(fov - camera.fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld();
    },
    dispose() {
      window.removeEventListener('pointermove', onMove);
    },
  };
}
