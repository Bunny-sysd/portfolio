// Every progress → value mapping for the descent lives here, so scene,
// camera and DOM always agree on where each beat is.
export const CHAPTERS = [
  { id: 'who', at: 0.20 },
  { id: 'mutagen', at: 0.33 },
  { id: 'vigil', at: 0.46 },
  { id: 'signalhub', at: 0.59 },
  { id: 'proving-grounds', at: 0.72 },
];

// Cloud layers are passed between beats: entry, then the midpoints.
export const CLOUD_LAYER_P = [0.10, 0.265, 0.395, 0.525, 0.655];

const PALETTE = [
  { p: 0.00, zenith: '#2a1b3d', horizon: '#f6b27a' },
  { p: 0.33, zenith: '#3b2a5c', horizon: '#b56a8f' },
  { p: 0.62, zenith: '#0d1530', horizon: '#283a6b' },
  { p: 1.00, zenith: '#02040a', horizon: '#0b1a33' },
];

export const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function smoothstep(e0, e1, x) {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const mix = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t);

export function paletteAt(p) {
  p = clamp01(p);
  let i = 0;
  while (i < PALETTE.length - 2 && p > PALETTE[i + 1].p) i++;
  const a = PALETTE[i];
  const b = PALETTE[i + 1];
  const t = smoothstep(a.p, b.p, p);
  return {
    zenith: mix(hexToRgb(a.zenith), hexToRgb(b.zenith), t),
    horizon: mix(hexToRgb(a.horizon), hexToRgb(b.horizon), t),
  };
}

// 1 within `hold` of the beat, fading to 0 over `fade` on either side.
export function beatOpacity(p, at, hold = 0.025, fade = 0.035) {
  return 1 - smoothstep(hold, hold + fade, Math.abs(p - at));
}

export const heroOpacity = (p) => 1 - smoothstep(0.03, 0.08, p);
export const contactOpacity = (p) => smoothstep(0.84, 0.9, p);
export const cityReveal = (p) => smoothstep(0.62, 0.85, p);

export const ALTITUDE_TOP = 50;
export const ALTITUDE_BOTTOM = -45;

// Half linear, half smoothstep: never stalls, but starts and lands gently.
export function altitudeAt(p) {
  const t = clamp01(p);
  const ease = (t + smoothstep(0, 1, t)) / 2;
  return ALTITUDE_TOP + (ALTITUDE_BOTTOM - ALTITUDE_TOP) * ease;
}
