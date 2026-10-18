const SOFTWARE_OR_WEAK_GPU = /swiftshader|llvmpipe|software|mali-4|mali-t6|mali-g5|mali-g3|powervr|adreno \(tm\) [2-5]\d\d/i;

// Only desktop-class machines ('high') get the per-pixel ray-traced black hole
// and the water mirror — both melt a mobile GPU. Phones and small/touch
// devices land on 'low' (cheap hole, no post), tablets/laptops on 'mid'
// (cheap hole, post on). `touch` is passed from a coarse-pointer check.
export function detectTier({ gpu = '', memory = 8, cores = 8, width = 1600, touch = false } = {}) {
  if (SOFTWARE_OR_WEAK_GPU.test(gpu) || memory <= 4 || cores <= 4) return 'low';
  if (width < 900 || touch) return 'low';
  if (width < 1500) return 'mid';
  return 'high';
}

// dprCap is the maximum device-pixel-ratio the renderer will use. The actual
// pixel ratio is min(devicePixelRatio, dprCap) — so on a high-DPR phone the
// canvas still renders at a crisp density (card text was blurry when this was
// a flat sub-1 scale that overrode DPR entirely), while capping it keeps the
// pixel count affordable. Desktop supersamples a little (dpr 1, cap 1.5).
export const TIER_SETTINGS = {
  low:  { dprCap: 1.5, postFX: false },
  mid:  { dprCap: 1.75, postFX: true },
  high: { dprCap: 2, postFX: true },
};
