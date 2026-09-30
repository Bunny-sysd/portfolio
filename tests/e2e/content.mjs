import { withPage, check, scrollToProgress, opacityOf, SHOTS } from './lib.mjs';

const CHAPTER_AT = { who: 0.20, mutagen: 0.33, vigil: 0.46, signalhub: 0.59, 'proving-grounds': 0.72 };

for (const viewport of [{ width: 1600, height: 1000 }, { width: 390, height: 844 }]) {
  await withPage({ viewport }, async (page, errors) => {
    const tag = `${viewport.width}`;
    check(await page.textContent('#hero h1') === 'Aaron Alva', `[${tag}] hero name`);
    check((await page.textContent('#hero')).includes('Scored 94'), `[${tag}] GFACT credential in hero`);
    check((await page.textContent('#hero')).includes('100+ Rooms'), `[${tag}] THM credential in hero`);
    check(await opacityOf(page, '#hero') > 0.95, `[${tag}] hero visible at load, no interaction`);
    await page.screenshot({ path: `${SHOTS}/content-${tag}-hero.png` });

    for (const [id, at] of Object.entries(CHAPTER_AT)) {
      await scrollToProgress(page, at);
      check(await opacityOf(page, `#chapter-${id}`) > 0.9, `[${tag}] ${id} visible on its beat`);
      check(await opacityOf(page, '#hero') < 0.05, `[${tag}] hero gone at ${id}`);
    }
    await scrollToProgress(page, 1);
    check(await opacityOf(page, '#contact') > 0.95, `[${tag}] contact visible at the bottom`);
    check(await page.$('#contact-form') !== null, `[${tag}] contact form present`);
    await page.screenshot({ path: `${SHOTS}/content-${tag}-contact.png` });

    await page.click('#to-top');
    await page.waitForTimeout(1800);
    check(await opacityOf(page, '#hero') > 0.95, `[${tag}] "overview" link returns to the hero`);
    check(errors.length === 0, `[${tag}] no console errors ${JSON.stringify(errors)}`);
  });
}
