// Load performance of the production build: shaders compile off the main
// thread and three's shader error checks are off, so no long task should
// approach a freeze. Needs `npm run build` and `npx vite preview --port 4173`.
import { chromium } from 'playwright';
import { check, GPU_ARGS } from './lib.mjs';

const PREVIEW = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/';
for (let i = 0; i < 3; i++) {
  const browser = await chromium.launch({ args: GPU_ARGS });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(PREVIEW);
  await page.waitForFunction(() => document.documentElement.classList.contains('scene-live'), null, { timeout: 15000 });
  const longest = await page.evaluate(() => new Promise((res) => {
    const d = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => d.push(e.duration))).observe({ type: 'longtask', buffered: true });
    setTimeout(() => res(Math.round(Math.max(0, ...d))), 300);
  }));
  check(longest < 250, `production load ${i + 1}: longest main-thread task ${longest} ms (< 250)`);
  await browser.close();
}
