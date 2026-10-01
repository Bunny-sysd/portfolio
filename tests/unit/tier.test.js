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
  it('uses mid for phones and high for desktops', () => {
    expect(detectTier({ gpu: 'Apple GPU', width: 390 })).toBe('mid');
    expect(detectTier({ gpu: 'NVIDIA GeForce RTX 5060 Ti', width: 1600 })).toBe('high');
  });
  it('has settings for every tier', () => {
    for (const t of ['low', 'mid', 'high']) expect(TIER_SETTINGS[t].renderScale).toBeGreaterThan(0);
    expect(TIER_SETTINGS.low.postFX).toBe(false);
  });
});
