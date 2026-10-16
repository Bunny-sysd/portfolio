const SOFTWARE_OR_WEAK_GPU = /swiftshader|llvmpipe|software|mali-4|mali-t6|powervr sgx|adreno \(tm\) [23]\d\d/i;

export function detectTier({ gpu = '', memory = 8, cores = 8, width = 1600 } = {}) {
  if (SOFTWARE_OR_WEAK_GPU.test(gpu) || memory <= 2 || cores <= 2) return 'low';
  if (width < 768) return 'mid';
  return 'high';
}

// renderScale is the canvas resolution in device-independent pixels. The
// particle core and the card screens are crisp detail (unlike the old soft
// cloud volume), and the scene is cheap per pixel, so it renders at or near
// 1×; only weak devices drop below.
export const TIER_SETTINGS = {
  low:  { renderScale: 0.75, postFX: false },
  mid:  { renderScale: 1, postFX: true },
  high: { renderScale: 1.25, postFX: true },
};
