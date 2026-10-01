import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

export const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
export const GPU_ARGS = ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'];
export const SHOTS = 'test-results/shots';
mkdirSync(SHOTS, { recursive: true });

export function check(cond, msg) {
  if (cond) console.log('ok  ', msg);
  else { console.error('FAIL', msg); process.exitCode = 1; }
}

export async function withPage(ctxOpts, fn, launchArgs = GPU_ARGS) {
  const browser = await chromium.launch({ args: launchArgs });
  const page = await browser.newPage(ctxOpts);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    await fn(page, errors);
  } finally {
    await browser.close();
  }
}

export async function scrollToProgress(page, p, settleMs = 900) {
  await page.evaluate((p) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo(0, Math.round(p * max));
  }, p);
  await page.waitForTimeout(settleMs);
}

export const opacityOf = (page, sel) =>
  page.$eval(sel, (el) => parseFloat(getComputedStyle(el).opacity));

// Sample a screen pixel from a real screenshot (the WebGL buffer isn't preserved).
export async function pixel(page, x, y) {
  const b64 = (await page.screenshot()).toString('base64');
  return page.evaluate(async ({ b64, x, y }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = new OffscreenCanvas(img.width, img.height);
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    return Array.from(g.getImageData(x, y, 1, 1).data.slice(0, 3));
  }, { b64, x, y });
}

// WCAG contrast ratio between an element's text colour (composited at its own
// alpha over the real rendered backdrop) and that backdrop, sampled from an
// actual screenshot with the element hidden — so it reflects whatever is
// behind it (sky, clouds, city grid, scrim) at the moment of the call, not a
// static guess.
export async function contrastOf(page, selector) {
  const { color, box } = await page.$eval(selector, (node) => {
    const cs = getComputedStyle(node);
    const r = node.getBoundingClientRect();
    return { color: cs.color, box: { x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)), width: Math.round(r.width), height: Math.round(r.height) } };
  });
  await page.evaluate((s) => { document.querySelector(s).style.visibility = 'hidden'; }, selector);
  const shot = await page.screenshot({ clip: box });
  await page.evaluate((s) => { document.querySelector(s).style.removeProperty('visibility'); }, selector);

  const bgRGB = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = new OffscreenCanvas(img.width, img.height); const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let r = 0, gg = 0, bb = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; n++; }
    return [r / n, gg / n, bb / n];
  }, shot.toString('base64'));

  const m = color.match(/[\d.]+/g).map(Number);
  const alpha = m.length > 3 ? m[3] : 1;
  const fgRGB = [m[0], m[1], m[2]].map((c, i) => alpha * c + (1 - alpha) * bgRGB[i]);
  const luminance = ([r, g, b]) => {
    const s = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  };
  const [l1, l2] = [luminance(fgRGB), luminance(bgRGB)];
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
