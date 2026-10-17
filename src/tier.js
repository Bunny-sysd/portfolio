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

// renderScale is the canvas resolution in device-independent pixels.
export const TIER_SETTINGS = {
  low:  { renderScale: 0.7, postFX: false },
  mid:  { renderScale: 1, postFX: true },
  high: { renderScale: 1.25, postFX: true },
};
