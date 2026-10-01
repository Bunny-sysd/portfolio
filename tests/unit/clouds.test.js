import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createClouds } from '../../src/scene/clouds.js';
import { CLOUD_LAYER_P } from '../../src/timeline.js';

const meshes = (scene) => scene.children.filter((c) => c.isMesh);
const visible = (scene) => meshes(scene).filter((m) => m.visible).length;

describe('cloud sheets', () => {
  it('clamps sheets per layer to the available sheet offsets', () => {
    const scene = new THREE.Scene();
    createClouds(scene, { sheetsPerLayer: 9, reducedMotion: () => false });
    expect(meshes(scene).length).toBe(CLOUD_LAYER_P.length * 3);
  });

  it('setSheetsPerLayer hides all but the first n sheets of every layer', () => {
    const scene = new THREE.Scene();
    const clouds = createClouds(scene, { sheetsPerLayer: 3, reducedMotion: () => false });
    clouds.setSheetsPerLayer(1);
    expect(visible(scene)).toBe(CLOUD_LAYER_P.length);
    clouds.setSheetsPerLayer(3);
    expect(visible(scene)).toBe(CLOUD_LAYER_P.length * 3);
  });
});
