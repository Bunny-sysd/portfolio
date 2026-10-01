const SOFTWARE_OR_WEAK_GPU = /swiftshader|llvmpipe|software|mali-4|mali-t6|powervr sgx|adreno \(tm\) [23]\d\d/i;

export function detectTier({ gpu = '', memory = 8, cores = 8, width = 1600 } = {}) {
  if (SOFTWARE_OR_WEAK_GPU.test(gpu) || memory <= 2 || cores <= 2) return 'low';
  if (width < 768) return 'mid';
  return 'high';
}

// renderScale is the canvas resolution in device-independent pixels: the
// volumetric backdrop is soft by nature, and all text is DOM, so rendering it
// below 1× and letting the browser upscale buys most of the frame budget.
export const TIER_SETTINGS = {
  low:  { renderScale: 0.4, postFX: false },
  mid:  { renderScale: 0.5, postFX: true },
  high: { renderScale: 0.7, postFX: true },
};
