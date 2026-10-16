// Dev helper: screenshots of each view for eyeballing (not part of npm run e2e).
// node tests/e2e/_shots.mjs [WxH] [prefix]
import { withPage, SHOTS, BASE } from './lib.mjs';

const [w, h] = (process.argv[2] || '1440x900').split('x').map(Number);
const prefix = process.argv[3] || 'look';
await withPage({ viewport: { width: w, height: h } }, async (page, errors) => {
  await page.waitForFunction(() => document.documentElement.classList.contains('scene-live'), null, { timeout: 15000 });
  await page.mouse.move(w * 0.6, h * 0.4);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${SHOTS}/${prefix}-home.png` });
  for (const [hash, name] of [['#/work', 'work'], ['#/work/vigil', 'detail'], ['#/contact', 'contact']]) {
    await page.goto(BASE + hash); await page.waitForTimeout(2600);
    await page.mouse.move(w * 0.62, h * 0.45);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOTS}/${prefix}-${name}.png` });
  }
  if (errors.length) console.log('errors:', errors);
});
