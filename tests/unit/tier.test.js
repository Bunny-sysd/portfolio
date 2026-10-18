import { describe, it, expect } from 'vitest';
import { detectTier, TIER_SETTINGS } from '../../src/tier.js';

describe('detectTier', () => {
  it('treats software renderers as low', () => {
    expect(detectTier({ gpu: 'ANGLE (Google, Vulkan (SwiftShader Device))' })).toBe('low');
    expect(detectTier({ gpu: 'llvmpipe (LLVM 15)' })).toBe('low');
  });
  it('treats weak devices as low', () => {
    expect(detectTier({ gpu: 'Apple GPU', memory: 2 })).toBe('low');
    expect(detectTier({ gpu: 'Apple GPU', cores: 2 })).toBe('low');
  });
  it('keeps phones and touch devices off the expensive ray-traced hole (low)', () => {
    expect(detectTier({ gpu: 'Apple A15 GPU', width: 390, memory: 8, cores: 8 })).toBe('low');
    expect(detectTier({ gpu: 'Apple M2', width: 1600, cores: 8, memory: 16, touch: true })).toBe('low');
  });
  it('uses mid for laptops and high only for capable desktops', () => {
    expect(detectTier({ gpu: 'Intel Iris', width: 1366, cores: 8, memory: 8 })).toBe('mid');
    expect(detectTier({ gpu: 'NVIDIA GeForce RTX 5060 Ti', width: 1920, cores: 16, memory: 16 })).toBe('high');
  });
  it('has settings for every tier', () => {
    for (const t of ['low', 'mid', 'high']) expect(TIER_SETTINGS[t].dprCap).toBeGreaterThanOrEqual(1);
    expect(TIER_SETTINGS.low.postFX).toBe(false);
  });
});
