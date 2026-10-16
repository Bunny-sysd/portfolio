import { describe, it, expect } from 'vitest';
import { sha256Hex, bitsOf } from '../../src/widgets/sigil.js';

describe('sigil', () => {
  it('hashes with real SHA-256', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('unpacks a digest into exactly 256 bits, MSB first', () => {
    const bits = bitsOf('8'.padEnd(64, '0'));
    expect(bits.length).toBe(256);
    expect([...bits.slice(0, 4)]).toEqual([1, 0, 0, 0]);
    expect(bits.reduce((a, b) => a + b, 0)).toBe(1);
  });
  it('shows the avalanche effect between project titles', async () => {
    const a = bitsOf(await sha256Hex('Mutagen')), b = bitsOf(await sha256Hex('Vigil'));
    const diff = a.reduce((n, v, i) => n + (v !== b[i]), 0);
    expect(diff).toBeGreaterThan(90);
    expect(diff).toBeLessThan(166);
  });
});
