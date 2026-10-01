import { chromium } from 'playwright';
import { withPage, check, scrollToProgress, opacityOf, contrastOf, pixel, SHOTS, BASE, GPU_ARGS } from './lib.mjs';

await withPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'reduce' }, async (page, errors) => {
  check(await opacityOf(page, '#hero') > 0.95, 'reduced motion: hero visible');
  await scrollToProgress(page, 0.33);
  check(await opacityOf(page, '#chapter-mutagen') > 0.9, 'reduced motion: chapters still reveal on scroll');
  check(await page.evaluate(() => !document.documentElement.classList.contains('lenis')), 'reduced motion: no smooth-scroll hijack');
  check(errors.length === 0, `reduced motion: no errors ${JSON.stringify(errors)}`);
});

await withPage({ viewport: { width: 1600, height: 1000 } }, async (page, errors) => {
  check(await page.evaluate(() => document.documentElement.classList.contains('no-webgl')), 'no WebGL: fallback class set');
  await page.screenshot({ path: `${SHOTS}/fallback-no-webgl.png` });
  await scrollToProgress(page, 0.46);
  check(await opacityOf(page, '#chapter-vigil') > 0.9, 'no WebGL: content still readable');
  check(errors.length === 0, `no WebGL: no errors ${JSON.stringify(errors)}`);
}, ['--disable-webgl', '--disable-3d-apis']);

// WebGL context lost mid-session: CSS dusk fallback takes over, content stays
// readable, and the scene comes back when the context is restored.
await withPage({ viewport: { width: 1600, height: 1000 } }, async (page, errors) => {
  const noWebgl = () => page.evaluate(() => document.documentElement.classList.contains('no-webgl'));
  check(!(await noWebgl()), 'context loss: WebGL active before');
  const ext = await page.evaluateHandle(() => {
    const c = document.getElementById('scene');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return gl.getExtension('WEBGL_lose_context');
  });
  await ext.evaluate((e) => e.loseContext());
  await page.waitForTimeout(500);
  check(await noWebgl(), 'context loss: fallback class set');
  check(await opacityOf(page, '#hero') > 0.95, 'context loss: hero still visible');
  const lede = await contrastOf(page, '#hero .lede');
  check(lede >= 4.5, `context loss: hero lede readable over the CSS gradient (${lede.toFixed(2)}:1)`);
  await page.screenshot({ path: `${SHOTS}/fallback-context-lost.png` });
  await scrollToProgress(page, 0.46);
  check(await opacityOf(page, '#chapter-vigil') > 0.9, 'context loss: chapters still reveal on scroll');
  await ext.evaluate((e) => e.restoreContext());
  await page.waitForTimeout(1000);
  check(!(await noWebgl()), 'context restored: fallback class removed');
  await scrollToProgress(page, 0, 1500);
  await page.screenshot({ path: `${SHOTS}/fallback-context-restored.png` });
  const [r, g, b] = await pixel(page, 1200, 520);
  check(r > 120 && r > b, `context restored: scene renders the warm horizon again (${r},${g},${b})`);
  check(errors.length === 0, `context loss/restore: no console errors ${JSON.stringify(errors)}`);
});

// No JavaScript at all (or before the bundle runs): the hero is already
// visible and readable over the CSS dusk gradient. The dev server injects CSS
// from JS, so when the served HTML has no stylesheet <link> (dev) the app's
// sheets are linked into it here, the way the production build links them.
{
  const browser = await chromium.launch({ args: GPU_ARGS });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, javaScriptEnabled: false });
    await page.route(BASE, async (route) => {
      const res = await route.fetch();
      let html = await res.text();
      if (!/<link[^>]+rel="stylesheet"[^>]+href="[^"]*\/assets\/[^"]+\.css"/.test(html)) {
        const links = ['src/styles/base.css', 'src/styles/chapters.css', 'src/styles/case-study.css']
          .map((s) => `<link rel="stylesheet" href="${new URL(s, BASE).href}">`).join('');
        html = html.replace('</head>', `${links}</head>`);
      }
      await route.fulfill({ response: res, body: html });
    });
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    check(await opacityOf(page, '#hero') > 0.95, 'no JS: hero visible before any script runs');
    const h1 = await contrastOf(page, '#hero h1');
    const lede = await contrastOf(page, '#hero .lede');
    check(h1 >= 3 && lede >= 4.5, `no JS: hero readable over the dusk gradient (h1 ${h1.toFixed(2)}:1, lede ${lede.toFixed(2)}:1)`);
    await page.screenshot({ path: `${SHOTS}/fallback-no-js.png` });
  } finally {
    await browser.close();
  }
}
