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

// Effective opacity of an element: its own times every ancestor's (a button's
// own computed opacity is 1 even when its beat is faded out).
const seenOpacity = (page, sel) => page.evaluate((sel) => {
  let el = sel ? document.querySelector(sel) : document.activeElement;
  let o = 1;
  for (; el && el.nodeType === 1; el = el.parentElement) {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') return 0;
    o *= parseFloat(cs.opacity);
  }
  return o;
}, sel);

// Keyboard and pointer only ever reach what's on screen.
for (const viewport of [{ width: 1600, height: 1000 }, { width: 390, height: 844 }]) {
  await withPage({ viewport }, async (page, errors) => {
    const tag = `${viewport.width} focus`;
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1800);
    const first = await page.evaluate(() => document.activeElement.textContent.trim());
    const firstSeen = await seenOpacity(page);
    check(firstSeen > 0.9, `[${tag}] first Tab stop is a visible control ("${first}", opacity ${firstSeen.toFixed(2)})`);

    let found = false;
    for (let i = 0; i < 40 && !found; i++) {
      await page.keyboard.press('Tab');
      found = await page.evaluate(() => document.activeElement.matches('[data-case="mutagen"]'));
    }
    check(found, `[${tag}] Tab reaches the Mutagen case-study button`);
    await page.waitForTimeout(1800);
    const mutagenSeen = await seenOpacity(page);
    check(mutagenSeen > 0.9, `[${tag}] tabbing to Mutagen brings its beat on screen (opacity ${mutagenSeen.toFixed(2)})`);

    // Just past Who's beat its button is faded (~0.15) but still sits on screen.
    await scrollToProgress(page, 0.25, 1500);
    const ghost = await page.$eval('[data-case="who"]', (b) => { const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    const ghostSeen = await seenOpacity(page, '[data-case="who"]');
    check(ghost.y > 0 && ghost.y < viewport.height && ghostSeen < 0.5, `[${tag}] faded Who button is on screen for the click test (y=${ghost.y.toFixed(0)}, opacity ${ghostSeen.toFixed(2)})`);
    await page.mouse.click(ghost.x, ghost.y);
    await page.waitForTimeout(400);
    check(await page.$('dialog[open]') === null, `[${tag}] clicking a faded beat's button opens nothing`);
    check(errors.length === 0, `[${tag}] no console errors ${JSON.stringify(errors)}`);
  });
}

// Contact form: empty message is refused; a filled one builds the mailto with
// both the name and the message (read through form.elements).
await withPage({ viewport: { width: 1600, height: 1000 } }, async (page, errors) => {
  const mailto = [];
  page.on('request', (r) => { if (r.url().startsWith('mailto:')) mailto.push(decodeURIComponent(r.url())); });
  await scrollToProgress(page, 1, 1500);
  await page.click('#contact-form button[type=submit]');
  check(await page.textContent('#contact .form-note') === 'Add a message first.', 'contact form: empty message is refused');
  await page.fill('#contact-form [name=name]', 'Ada Lovelace');
  await page.fill('#contact-form [name=message]', 'Hello from the test');
  await page.click('#contact-form button[type=submit]');
  await page.waitForTimeout(500);
  check((await page.textContent('#contact .form-note')).startsWith('Opening your email app'), 'contact form: filled message opens the email app');
  check(mailto.length === 1 && mailto[0].includes('Ada Lovelace') && mailto[0].includes('Hello from the test'), `contact form: mailto carries name and message (${JSON.stringify(mailto[0])})`);
  check(errors.length === 0, `contact form: no console errors ${JSON.stringify(errors)}`);
});
