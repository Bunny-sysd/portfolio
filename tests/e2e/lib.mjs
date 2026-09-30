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
