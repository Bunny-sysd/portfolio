import { withPage, check, scrollToProgress, pixel, SHOTS } from './lib.mjs';

const POINTS = [0, 0.1, 0.2, 0.265, 0.33, 0.46, 0.59, 0.72, 0.85, 1];

for (const viewport of [{ width: 1600, height: 1000 }, { width: 390, height: 844 }]) {
  await withPage({ viewport }, async (page, errors) => {
    const tag = `${viewport.width}`;
    check(!(await page.evaluate(() => document.documentElement.classList.contains('no-webgl'))), `[${tag}] WebGL active`);
    for (const p of POINTS) {
      await scrollToProgress(page, p, 1200);
      await page.screenshot({ path: `${SHOTS}/scene-${tag}-${String(p).padEnd(5, '0')}.png` });
    }
    await scrollToProgress(page, 0, 1500);
    const [r, , b] = await pixel(page, Math.round(viewport.width / 2), Math.round(viewport.height * 0.52));
    check(r > b, `[${tag}] warm dusk near the horizon at the top (r=${r} b=${b})`);
    await scrollToProgress(page, 1, 1500);
    const [r2, g2, b2] = await pixel(page, Math.round(viewport.width * 0.85), 8);
    check(r2 + g2 + b2 < 120, `[${tag}] dark night sky at the bottom (${r2},${g2},${b2})`);
    const fps = await page.evaluate(() => new Promise((res) => {
      let n = 0; const t0 = performance.now();
      (function f() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / 2); })();
    }));
    check(fps >= 45, `[${tag}] fps ${fps} >= 45`);
    check(errors.length === 0, `[${tag}] no console errors ${JSON.stringify(errors)}`);
  });
}
