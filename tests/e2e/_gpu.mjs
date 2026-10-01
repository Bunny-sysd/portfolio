// GPU time per frame at points through the film, via a WebGL timer query —
// dev tool for tuning shader cost, not part of `npm run e2e`.
import { chromium } from 'playwright';
import { BASE, GPU_ARGS } from './lib.mjs';
const [w, h] = (process.argv[2] || '1920x1080').split('x').map(Number);
const browser = await chromium.launch({ args: GPU_ARGS });
const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.goto(BASE); await page.waitForTimeout(1200);
const out = {};
for (const p of [0, 0.1, 0.15, 0.2, 0.27, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) {
  await page.evaluate((p) => scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight)), p);
  await page.waitForTimeout(1800);
  out[p] = await page.evaluate(async () => {
    const { renderer, scene, camera } = window.__stage; const gl = renderer.getContext();
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2'); if (!ext) return 'no-ext';
    const ms = [];
    for (let i = 0; i < 12; i++) {
      const q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
      renderer.render(scene, camera); gl.endQuery(ext.TIME_ELAPSED_EXT);
      await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r));
      if (gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) ms.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
    }
    ms.sort((a, b) => a - b); return ms.length ? +ms[ms.length >> 1].toFixed(2) : 'n/a';
  });
}
console.log(w + 'x' + h, 'scale', await page.evaluate(() => window.__stage.renderer.getPixelRatio()), JSON.stringify(out));
await browser.close();
