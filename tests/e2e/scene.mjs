import { withPage, check, scrollToProgress, pixel, SHOTS } from './lib.mjs';

const POINTS = [0, 0.1, 0.2, 0.265, 0.33, 0.46, 0.59, 0.72, 0.85, 1];
const CITY_GLOW_MARGIN = 40; // point-light pixels; tuned against measured counts (see commit)

// Hides the DOM chrome (chapter text, overview link, mist overlay) so a
// screenshot's bright-pixel count reflects only what's drawn on the WebGL
// canvas — a plain DOM element (e.g. the contact form's white button) can't
// satisfy this on its own the way it could when the clip included the page.
async function hideChrome(page) {
  await page.evaluate(() => {
    for (const sel of ['.track', '#to-top', '.mist']) {
      const el = document.querySelector(sel);
      if (el) el.style.visibility = 'hidden';
    }
  });
}
async function showChrome(page) {
  await page.evaluate(() => {
    for (const sel of ['.track', '#to-top', '.mist']) {
      const el = document.querySelector(sel);
      if (el) el.style.removeProperty('visibility');
    }
  });
}
async function canvasBrightPixels(page, viewport) {
  await hideChrome(page);
  const shot = await page.screenshot({ clip: { x: 0, y: Math.round(viewport.height * 0.6), width: viewport.width, height: Math.round(viewport.height * 0.4) } });
  await showChrome(page);
  return page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = new OffscreenCanvas(img.width, img.height); const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    // Count point lights, not brightness: a bright pixel with darkness a few
    // pixels away on some side. Sunlit cloud is bright but smooth, so it no
    // longer counts as "city"; lights scattered on a dark ground do.
    const { width: w, height: h } = c;
    const d = g.getImageData(0, 0, w, h).data;
    const lum = (x, y) => { const i = (y * w + x) * 4; return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; };
    const R = 4; let n = 0;
    for (let y = R; y < h - R; y++) for (let x = R; x < w - R; x++) {
      if (lum(x, y) < 140) continue;
      if (Math.min(lum(x - R, y), lum(x + R, y), lum(x, y - R), lum(x, y + R)) < 60) n++;
    }
    return n;
  }, shot.toString('base64'));
}

for (const viewport of [{ width: 1600, height: 1000 }, { width: 390, height: 844 }]) {
  await withPage({ viewport }, async (page, errors) => {
    const tag = `${viewport.width}`;
    check(!(await page.evaluate(() => document.documentElement.classList.contains('no-webgl'))), `[${tag}] WebGL active`);
    for (const p of POINTS) {
      await scrollToProgress(page, p, 1200);
      await page.screenshot({ path: `${SHOTS}/scene-${tag}-${p.toFixed(3)}.png` });
    }
    await scrollToProgress(page, 0.10, 1500);
    const mist = await page.$eval('.mist', (el) => parseFloat(getComputedStyle(el).opacity));
    check(mist > 0.3, `[${tag}] mist engulfs the camera while passing the first layer (${mist})`);
    await scrollToProgress(page, 0.20, 1500);
    const clear = await page.$eval('.mist', (el) => parseFloat(getComputedStyle(el).opacity));
    check(clear < 0.05, `[${tag}] mist clears between layers (${clear})`);
    await scrollToProgress(page, 0, 1500);
    const [r, , b] = await pixel(page, Math.round(viewport.width / 2), Math.round(viewport.height * 0.52));
    check(r > b, `[${tag}] warm dusk near the horizon at the top (r=${r} b=${b})`);
    await scrollToProgress(page, 1, 1500);
    const [r2, g2, b2] = await pixel(page, Math.round(viewport.width * 0.85), 8);
    check(r2 + g2 + b2 < 120, `[${tag}] dark night sky at the bottom (${r2},${g2},${b2})`);
    await scrollToProgress(page, 0.40, 1500);
    const brightBeforeReveal = await canvasBrightPixels(page, viewport);
    await scrollToProgress(page, 1, 1500);
    const brightAtReveal = await canvasBrightPixels(page, viewport);
    check(
      brightAtReveal > brightBeforeReveal + CITY_GLOW_MARGIN,
      `[${tag}] city lights glow in the canvas-only lower frame once revealed (${brightBeforeReveal} px at p=0.40 -> ${brightAtReveal} px at p=1.0)`,
    );
    const fps = await page.evaluate(() => new Promise((res) => {
      let n = 0; const t0 = performance.now();
      (function f() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / 2); })();
    }));
    check(fps >= 45, `[${tag}] fps ${fps} >= 45`);
    check(errors.length === 0, `[${tag}] no console errors ${JSON.stringify(errors)}`);
  });
}

// FPS watchdog must ignore time spent away from the tab and one-off stalls:
// two tab switches and two 2 s main-thread stalls, each followed by enough
// normal frames to close a watchdog window, must leave quality at full.
await withPage({ viewport: { width: 1600, height: 1000 } }, async (page, errors) => {
  const quality = () => page.evaluate(() => document.documentElement.dataset.quality);
  await page.waitForTimeout(2500);
  check(await quality() === 'full', `watchdog: starts at full quality (${await quality()})`);
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(2500);
  }
  check(await quality() === 'full', `watchdog: two tab switches keep full quality (${await quality()})`);
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => { const t = performance.now(); while (performance.now() - t < 2000); });
    await page.waitForTimeout(2500);
  }
  check(await quality() === 'full', `watchdog: two 2 s stalls keep full quality, post FX still on (${await quality()})`);
  check(errors.length === 0, `watchdog: no console errors ${JSON.stringify(errors)}`);
});
