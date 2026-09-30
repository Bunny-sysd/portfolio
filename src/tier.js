const SOFTWARE_OR_WEAK_GPU = /swiftshader|llvmpipe|software|mali-4|mali-t6|powervr sgx|adreno \(tm\) [23]\d\d/i;

export function detectTier({ gpu = '', memory = 8, cores = 8, width = 1600 } = {}) {
  if (SOFTWARE_OR_WEAK_GPU.test(gpu) || memory <= 2 || cores <= 2) return 'low';
  if (width < 768) return 'mid';
  return 'high';
}

export const TIER_SETTINGS = {
  low:  { dprCap: 1.0, sheetsPerLayer: 1, postFX: false, cityLights: 250 },
  mid:  { dprCap: 1.5, sheetsPerLayer: 2, postFX: true,  cityLights: 500 },
  high: { dprCap: 2.0, sheetsPerLayer: 3, postFX: true,  cityLights: 900 },
};
