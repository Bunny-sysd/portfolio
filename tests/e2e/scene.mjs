import { withPage, check, scrollToProgress, pixel, SHOTS } from './lib.mjs';

const POINTS = [0, 0.1, 0.2, 0.265, 0.33, 0.46, 0.59, 0.72, 0.85, 1];
const CITY_GLOW_MARGIN = 300; // measured delta is ~830px (mobile) to ~5500px (desktop); this leaves large headroom

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
    const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 2] > 170 && d[i + 1] > 140) n++;
    return n;
  }, shot.toString('base64'));
}

for (const viewport of [{ width: 1600, height: 1000 }, { width: 390, height: 844 }]) {
  await withPage({ viewport }, async (page, errors) => {
    const tag = `${viewport.width}`;
    check(!(await page.evaluate(() => document.documentElement.classList.contains('no-webgl'))), `[${tag}] WebGL active`);
    for (const p of POINTS) {
      await scrollToProgress(page, p, 1200);
      await page.screenshot({ path: `${SHOTS}/scene-${tag}-${String(p).padEnd(5, '0')}.png` });
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
