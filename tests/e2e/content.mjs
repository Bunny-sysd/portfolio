import { withPage, check, scrollToProgress, opacityOf, contrastOf, SHOTS } from './lib.mjs';

// Hero lines checked for WCAG AA (4.5:1 — none of them is large text) over
// the brightest backdrop in the film, the low sun.
const HERO_CONTRAST = {
  eyebrow: '#hero .eyebrow',
  lede: '#hero .lede',
  link: '#hero .hero-links a',
  cred: '#hero .creds li:first-child a',
};

const CHAPTER_AT = { who: 0.20, mutagen: 0.33, vigil: 0.46, signalhub: 0.59, 'proving-grounds': 0.72 };
const ALL_BEATS_AT = { hero: 0, ...CHAPTER_AT, contact: 1.0 };

async function checkHeadlinesFit(page, tag) {
  const overflowing = await page.$$eval('#hero h1, .beat h2', (els) =>
    els
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return el.scrollWidth > el.clientWidth + 1 || r.right > innerWidth;
      })
      .map((el) => el.textContent.trim())
  );
  check(overflowing.length === 0, `[${tag}] no headline overflows its box or the viewport (offenders: ${JSON.stringify(overflowing)})`);
}

for (const viewport of [{ width: 1600, height: 1000 }, { width: 390, height: 844 }, { width: 1280, height: 800 }, { width: 768, height: 1024 }]) {
  await withPage({ viewport }, async (page, errors) => {
    const tag = `${viewport.width}`;
    check(await page.textContent('#hero h1') === 'Aaron Alva', `[${tag}] hero name`);
    check((await page.textContent('#hero')).includes('Scored 94'), `[${tag}] GFACT credential in hero`);
    check((await page.textContent('#hero')).includes('100+ Rooms'), `[${tag}] THM credential in hero`);
    check(await opacityOf(page, '#hero') > 0.95, `[${tag}] hero visible at load, no interaction`);
    await page.screenshot({ path: `${SHOTS}/content-${tag}-hero.png` });
    if (viewport.width === 1600 || viewport.width === 390) {
      for (const [name, sel] of Object.entries(HERO_CONTRAST)) {
        const ratio = await contrastOf(page, sel);
        check(ratio >= 4.5, `[${tag}] hero ${name} meets WCAG AA contrast (${ratio.toFixed(2)}:1)`);
      }
    }

    for (const [id, at] of Object.entries(ALL_BEATS_AT)) {
      await scrollToProgress(page, at);
      await checkHeadlinesFit(page, `${tag} ${id}`);
    }

    for (const [id, at] of Object.entries(CHAPTER_AT)) {
      await scrollToProgress(page, at);
      check(await opacityOf(page, `#chapter-${id}`) > 0.9, `[${tag}] ${id} visible on its beat`);
      check(await opacityOf(page, '#hero') < 0.05, `[${tag}] hero gone at ${id}`);
      if (id === 'who') {
        const whoContrast = await contrastOf(page, '#chapter-who .beat__inner > p:nth-of-type(2)');
        check(whoContrast >= 4.5, `[${tag}] who paragraph meets WCAG AA contrast (${whoContrast.toFixed(2)}:1)`);
      }
      if (id === 'mutagen') {
        const mutagenContrast = await contrastOf(page, '#chapter-mutagen .beat__inner > p:nth-of-type(2)');
        check(mutagenContrast >= 4.5, `[${tag}] mutagen paragraph meets WCAG AA contrast (${mutagenContrast.toFixed(2)}:1)`);
      }
    }
    await scrollToProgress(page, 1);
    check(await opacityOf(page, '#contact') > 0.95, `[${tag}] contact visible at the bottom`);
    check(await page.$('#contact-form') !== null, `[${tag}] contact form present`);
    const contactContrast = await contrastOf(page, '#contact .beat__inner > p:nth-of-type(2)');
    check(contactContrast >= 4.5, `[${tag}] contact paragraph meets WCAG AA contrast over the city grid (${contactContrast.toFixed(2)}:1)`);
    await page.screenshot({ path: `${SHOTS}/content-${tag}-contact.png` });

    await page.click('#to-top');
    await page.waitForTimeout(1800);
    check(await opacityOf(page, '#hero') > 0.95, `[${tag}] "overview" link returns to the hero`);
    check(errors.length === 0, `[${tag}] no console errors ${JSON.stringify(errors)}`);
  });
}

// Short window (folded-in follow-up): a shallow viewport leaves little room
// between the fixed chrome and the fold, so verify each beat's text box is
// never clipped top or bottom at its own beat.
const BEAT_SELECTOR = (id) => (id === 'hero' ? '#hero .beat__inner' : id === 'contact' ? '#contact .beat__inner' : `#chapter-${id} .beat__inner`);

await withPage({ viewport: { width: 1280, height: 600 } }, async (page, errors) => {
  for (const [id, at] of Object.entries(ALL_BEATS_AT)) {
    await scrollToProgress(page, at);
    const rect = await page.$eval(BEAT_SELECTOR(id), (el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    });
    check(
      rect.top >= 0 && rect.bottom <= 600,
      `[1280x600] ${id} beat text fits within the short viewport (top=${rect.top.toFixed(1)} bottom=${rect.bottom.toFixed(1)})`,
    );
  }
  check(errors.length === 0, `[1280x600] no console errors ${JSON.stringify(errors)}`);
});
