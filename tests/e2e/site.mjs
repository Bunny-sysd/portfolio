// The view-based site: home → work carousel → project detail → contact, the
// terminal, routing and deep links, input (wheel, keys, swipe), contrast,
// load, and both motion settings. Needs the dev server: node tests/e2e/site.mjs
import { withPage, check, contrastOf, SHOTS, BASE } from './lib.mjs';

const live = (page) => page.waitForFunction(() => document.documentElement.classList.contains('scene-live'), null, { timeout: 15000 });
const view = (page) => page.evaluate(() => document.documentElement.dataset.view);
const caption = (page) => page.evaluate(() => {
  const t = document.querySelector('.caption__title');
  return { index: document.querySelector('.caption__index').textContent, title: t.querySelector('.sr-only')?.textContent ?? t.textContent };
});

for (const reduced of [false, true]) {
  const tag = reduced ? 'reduced' : 'motion';
  await withPage({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' }, async (page, errors) => {
    await live(page);
    // Load: credentials first, and compiling never freezes the page.
    check(await page.textContent('#home-title') === 'Aaron Alva', `${tag}: home shows the name`);
    for (const s of ['Scored 94', '100+ Rooms', 'Apprentice L25']) check((await page.textContent('#view-home')).includes(s), `${tag}: home shows "${s}"`);
    const longest = await page.evaluate(() => new Promise((res) => {
      const d = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => d.push(e.duration))).observe({ type: 'longtask', buffered: true });
      setTimeout(() => res(Math.round(Math.max(0, ...d))), 200);
    }));
    // The dev server keeps three's shader error checks on (they force a sync
    // wait on first use), so the dev bound is looser; perf.mjs holds the
    // production build to 250 ms.
    check(longest < 450, `${tag}: no main-thread freeze while loading, dev build (longest task ${longest} ms)`);
    await page.waitForTimeout(2000);
    check(!(await page.$('.boot')), `${tag}: boot readout clears`);
    for (const s of ['#view-home .eyebrow', '#view-home .lede', '#view-home .creds li:first-child a', '#view-home .cue']) {
      const c = await contrastOf(page, s);
      check(c >= 4.5, `${tag}: ${s} meets AA (${c.toFixed(2)}:1)`);
    }
    await page.screenshot({ path: `${SHOTS}/site-home-${tag}.png` });

    // Home → work by wheel.
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(1500);
    check(await view(page) === 'work' && page.url().endsWith('#/work'), `${tag}: scrolling down from home enters work (#/work)`);
    check((await caption(page)).title === 'Mutagen', `${tag}: carousel starts on Mutagen`);
    // Carousel: wheel, arrow buttons, keys.
    await page.mouse.wheel(0, 150); await page.waitForTimeout(500);
    check((await caption(page)).index.startsWith('02'), `${tag}: wheel steps the carousel (${(await caption(page)).index})`);
    await page.click('[data-step="1"]'); await page.waitForTimeout(400);
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(400);
    check((await caption(page)).title === 'Vigil', `${tag}: arrow button and key step it (${(await caption(page)).title})`);
    await page.waitForTimeout(1200);
    check((await caption(page)).title === await page.$eval('.caption__title', (t) => t.textContent), `${tag}: caption settles on the real title`);
    await page.screenshot({ path: `${SHOTS}/site-work-${tag}.png` });
    // The front card is centred in the frame (camera on its mark).
    const front = await page.evaluate(() => {
      const w = window.__world, cam = window.__stage.camera;
      const c = w.cards.cards.find((c) => c.project.id === 'vigil');
      const v = c.mesh.getWorldPosition(c.mesh.position.clone()).project(cam);
      return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight };
    });
    check(Math.abs(front.x - 720) < 60 && front.y > 400 && front.y < 700, `${tag}: front card sits centre-frame (${Math.round(front.x)},${Math.round(front.y)})`);

    // Filters.
    await page.click('[data-filter="ctf"]'); await page.waitForTimeout(500);
    check((await caption(page)).title === 'Proving Grounds' && (await caption(page)).index.endsWith('01'), `${tag}: ctf filter leaves only Proving Grounds`);
    check(await page.getAttribute('[data-filter="ctf"]', 'aria-pressed') === 'true', `${tag}: active filter is aria-pressed`);
    await page.click('[data-filter="ctf"]'); await page.waitForTimeout(500);
    check((await caption(page)).index.endsWith('07'), `${tag}: clicking it again clears the filter`);

    // Open a project from the caption; scroll to close.
    await page.click('.caption__open'); await page.waitForTimeout(1600);
    check(await view(page) === 'detail' && /#\/work\/[a-z-]+$/.test(page.url()), `${tag}: Open project routes to #/work/<id> (${page.url().split('#')[1]})`);
    const title = await page.$eval('.detail__title', (t) => t.querySelector('.sr-only')?.textContent ?? t.textContent);
    check(title === 'Mutagen', `${tag}: detail shows the project (${title})`);
    check((await page.textContent('.detail__blurb')).includes('agentic AI fuzzer'), `${tag}: detail copy is the verified blurb`);
    await page.screenshot({ path: `${SHOTS}/site-detail-${tag}.png` });
    for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(30); }
    await page.waitForTimeout(900);
    check(await view(page) === 'work', `${tag}: scrolling in a project closes it`);
    // Deep link, then Escape closes.
    await page.goto(BASE + '#/work/signalhub'); await page.waitForTimeout(1200);
    check(await view(page) === 'detail', `${tag}: deep link #/work/signalhub opens its detail`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(800);
    check(await view(page) === 'work', `${tag}: Escape closes a project`);

    // Contact overlay and back.
    await page.click('[data-nav="contact"]'); await page.waitForTimeout(1500);
    check(await view(page) === 'contact', `${tag}: Contact opens the overlay`);
    check(await page.textContent('[data-nav="contact"]') === 'Close ✕', `${tag}: nav pill turns into Close`);
    const lede = await contrastOf(page, '.contact__links a:nth-child(2)');
    check(lede >= 4.5, `${tag}: contact links readable over the frosted scene (${lede.toFixed(2)}:1)`);
    await page.screenshot({ path: `${SHOTS}/site-contact-${tag}.png` });
    await page.click('[data-nav="contact"]'); await page.waitForTimeout(1000);
    check(await view(page) === 'work', `${tag}: Close returns to where you were`);

    // Terminal: real data only, input never parsed as HTML.
    await page.fill('.term__in', 'certs'); await page.press('.term__in', 'Enter');
    check((await page.textContent('.term__out')).includes('Scored 94'), `${tag}: terminal certs prints verified credentials`);
    await page.fill('.term__in', '<img src=x onerror=window.__pwned=1>'); await page.press('.term__in', 'Enter');
    await page.waitForTimeout(200);
    check(!(await page.evaluate(() => window.__pwned)) && !(await page.$('.term__out img')), `${tag}: terminal renders input as text, never HTML`);
    await page.fill('.term__in', 'open vigil'); await page.press('.term__in', 'Enter'); await page.waitForTimeout(1200);
    check(page.url().endsWith('#/work/vigil'), `${tag}: terminal "open vigil" flies to the project`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(600);

    // Back button walks the history.
    await page.goBack(); await page.waitForTimeout(800);
    check(['work', 'detail'].includes(await view(page)), `${tag}: browser Back moves between views (${await view(page)})`);

    // Decode only with motion; screen readers always get the real text.
    await page.goto(BASE + '#/work'); await page.waitForTimeout(1200);
    const order = ['Mutagen', 'Vigil', 'SignalHub', 'Proving Grounds', 'Jarvis', 'Homelab', 'Researcher'];
    const nextTitle = order[(order.indexOf((await caption(page)).title) + 1) % order.length];
    await page.click('[data-step="1"]'); await page.waitForTimeout(80);
    const mid = await page.$eval('.caption__title', (t) => ({ sr: t.querySelector('.sr-only')?.textContent ?? t.textContent, shown: t.querySelector('[aria-hidden]')?.textContent ?? t.textContent }));
    check(mid.sr === nextTitle, `${tag}: accessible caption is the real title while decoding (${mid.sr})`);
    if (reduced) check(mid.shown === nextTitle, `${tag}: no scramble under reduced motion`);
    else check(mid.shown !== nextTitle, `${tag}: caption scrambles in ("${mid.shown}")`);

    check(errors.length === 0, `${tag}: no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  });
}

// Cursor fluid: a pointer sweep puts energy into the velocity field with
// motion on, none under reduced motion; either way it decays back to rest.
// (Read from the field itself: this scene animates constantly, so screenshot
// diffs can't separate the fluid from the core's own motion.)
for (const reduced of [false, true]) {
  const tag = reduced ? 'reduced' : 'motion';
  await withPage({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' }, async (page) => {
    await live(page);
    await page.goto(BASE + '#/work'); await page.waitForTimeout(2000);
    const energy = () => page.evaluate(() => window.__fluidEnergy());
    const rest = await energy();
    for (let i = 0; i <= 14; i++) await page.mouse.move(380 + i * 50, 200 + i * 22);
    await page.waitForTimeout(60);
    const stirred = await energy();
    if (reduced) check(stirred < 0.002, `${tag}: pointer sweep leaves the fluid still (${stirred.toFixed(4)})`);
    else check(stirred > rest + 0.01, `${tag}: pointer sweep stirs the fluid (${rest.toFixed(4)} -> ${stirred.toFixed(4)})`);
    await page.waitForTimeout(4000);
    const settled = await energy();
    check(settled < Math.max(0.003, stirred * 0.1), `${tag}: fluid settles once the pointer stops (${settled.toFixed(4)})`);
  });
}

// Phone: swipe through the carousel, readable home.
await withPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, async (page, errors) => {
  await live(page);
  await page.waitForTimeout(1500);
  for (const s of ['#view-home .eyebrow', '#view-home .lede']) {
    const c = await contrastOf(page, s);
    check(c >= 4.5, `390: ${s} meets AA over the core (${c.toFixed(2)}:1)`);
  }
  const swipe = (x0, y0, x1, y1) => page.evaluate(([x0, y0, x1, y1]) => {
    const t = (x, y) => new Touch({ identifier: 1, target: document.body, clientX: x, clientY: y });
    document.body.dispatchEvent(new TouchEvent('touchstart', { touches: [t(x0, y0)], changedTouches: [t(x0, y0)], bubbles: true }));
    document.body.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t(x1, y1)], bubbles: true }));
  }, [x0, y0, x1, y1]);
  await swipe(200, 600, 200, 300); await page.waitForTimeout(1200);
  check(await view(page) === 'work', '390: swiping up from home enters work');
  await swipe(300, 450, 80, 450); await page.waitForTimeout(600);
  check((await caption(page)).index.startsWith('02'), '390: swiping left steps the carousel');
  await page.screenshot({ path: `${SHOTS}/site-work-390.png` });
  const overflow = await page.evaluate(() => [...document.querySelectorAll('.view.is-active *, .chrome *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).map((e) => e.className));
  check(overflow.length === 0, `390: nothing spills off-screen (${JSON.stringify(overflow)})`);
  check(errors.length === 0, `390: no console errors ${JSON.stringify(errors)}`);
});
