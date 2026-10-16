import { chromium } from 'playwright';
import { withPage, check, opacityOf, contrastOf, SHOTS, BASE, GPU_ARGS } from './lib.mjs';

const view = (page) => page.evaluate(() => document.documentElement.dataset.view);

// No WebGL: the DOM carries everything (home, the work caption and arrows,
// details, contact) over the CSS backdrop.
await withPage({ viewport: { width: 1600, height: 1000 } }, async (page, errors) => {
  check(await page.evaluate(() => document.documentElement.classList.contains('no-webgl')), 'no WebGL: fallback class set');
  check(await opacityOf(page, '#view-home') > 0.95, 'no WebGL: home visible');
  const lede = await contrastOf(page, '#view-home .lede');
  check(lede >= 4.5, `no WebGL: home lede readable (${lede.toFixed(2)}:1)`);
  await page.screenshot({ path: `${SHOTS}/fallback-no-webgl.png` });
  await page.click('.cue'); await page.waitForTimeout(1200);
  check(await view(page) === 'work', 'no WebGL: work view reachable');
  await page.click('[data-step="1"]'); await page.waitForTimeout(300);
  check((await page.textContent('.caption__index')).startsWith('02'), 'no WebGL: carousel steps by its buttons');
  await page.click('.caption__open'); await page.waitForTimeout(1000);
  check(await view(page) === 'detail' && (await page.textContent('.detail__blurb')).length > 40, 'no WebGL: project detail readable');
  check(errors.length === 0, `no WebGL: no errors ${JSON.stringify(errors)}`);
}, ['--disable-webgl', '--disable-3d-apis']);

// Context lost mid-session: the CSS backdrop takes over, the views keep
// working, and the scene comes back on restore.
await withPage({ viewport: { width: 1600, height: 1000 } }, async (page, errors) => {
  await page.waitForFunction(() => document.documentElement.classList.contains('scene-live'));
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
  const lede = await contrastOf(page, '#view-home .lede');
  check(lede >= 4.5, `context loss: home lede readable over the CSS backdrop (${lede.toFixed(2)}:1)`);
  await page.click('.cue'); await page.waitForTimeout(1200);
  check(await view(page) === 'work', 'context loss: views still navigate');
  await ext.evaluate((e) => e.restoreContext());
  await page.waitForTimeout(1500);
  check(!(await noWebgl()), 'context restored: fallback class removed');
  const card = await page.evaluate(() => window.__world.cards.cards[0].mesh.visible);
  check(card, 'context restored: the card ring renders again');
  await page.screenshot({ path: `${SHOTS}/fallback-context-restored.png` });
  check(errors.length === 0, `context loss/restore: no console errors ${JSON.stringify(errors)}`);
});

// No JavaScript at all: home (name + credentials) is visible and readable.
// The dev server injects CSS from JS, so its sheets are linked in here the
// way the production build links them.
{
  const browser = await chromium.launch({ args: GPU_ARGS });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, javaScriptEnabled: false });
    await page.route(BASE, async (route) => {
      const res = await route.fetch();
      let html = await res.text();
      if (!/<link[^>]+rel="stylesheet"[^>]+href="[^"]*\/assets\/[^"]+\.css"/.test(html)) {
        const links = ['src/styles/site.css', 'src/styles/case-study.css']
          .map((s) => `<link rel="stylesheet" href="${new URL(s, BASE).href}">`).join('');
        html = html.replace('</head>', `${links}</head>`);
      }
      await route.fulfill({ response: res, body: html });
    });
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    check(await opacityOf(page, '#view-home') > 0.95, 'no JS: home visible before any script runs');
    const h1 = await contrastOf(page, '#home-title');
    const lede = await contrastOf(page, '#view-home .lede');
    check(h1 >= 3 && lede >= 4.5, `no JS: home readable (h1 ${h1.toFixed(2)}:1, lede ${lede.toFixed(2)}:1)`);
    check((await page.textContent('#view-home')).includes('Scored 94'), 'no JS: credentials present');
    await page.screenshot({ path: `${SHOTS}/fallback-no-js.png` });
  } finally {
    await browser.close();
  }
}
