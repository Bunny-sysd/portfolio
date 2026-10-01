import { withPage, check, scrollToProgress, opacityOf, SHOTS } from './lib.mjs';

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
