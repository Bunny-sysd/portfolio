// Active Theory-style polish: pill nav, cursor fluid in the post pass, and the
// frosted nav corner. Run with the dev server up: node tests/e2e/polish.mjs
import { withPage, check, scrollToProgress, SHOTS } from './lib.mjs';

const VIEW = { viewport: { width: 1440, height: 900 } };

// Mean absolute difference between two PNG screenshots of a region, via the
// page's own canvas (keeps this file dependency-free).
async function diffRegion(page, a, b) {
  return page.evaluate(async ([a, b]) => {
    const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height;
    const g = c.getContext('2d');
    g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, c.width, c.height).data;
    g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, c.width, c.height).data;
    let s = 0; for (let i = 0; i < da.length; i += 4) s += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
    return s / (da.length / 4) / 3;
  }, [a, b]);
}
const shot = async (page, clip) => `data:image/png;base64,${(await page.screenshot({ clip })).toString('base64')}`;

for (const reduced of [false, true]) {
  const tag = reduced ? 'reduced' : 'motion';
  await withPage({ ...VIEW, reducedMotion: reduced ? 'reduce' : 'no-preference' }, async (page, errors) => {
    await page.waitForFunction(() => document.documentElement.classList.contains('scene-live'));
    // Shaders compile off the main thread, so loading never freezes the page
    // (drawing straight away used to block it for ~800 ms).
    const longest = await page.evaluate(() => new Promise((res) => {
      const d = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => d.push(e.duration))).observe({ type: 'longtask', buffered: true });
      setTimeout(() => res(Math.round(Math.max(0, ...d))), 200);
    }));
    check(longest < 250, `${tag}: no main-thread freeze while the scene loads (longest task ${longest} ms)`);
    await page.waitForTimeout(2000);
    check(!(await page.$('.boot')), `${tag}: boot readout clears once the scene is live`);
    await scrollToProgress(page, 0.2, 2500);
    const quality = await page.evaluate(() => document.documentElement.dataset.quality);
    check(quality === 'full', `${tag}: post FX running (quality=${quality})`);

    // The region the pointer sweeps through, with the pointer parked away from it.
    const clip = { x: 520, y: 300, width: 400, height: 300 };
    await page.mouse.move(80, 820);
    await page.waitForTimeout(1500);
    const still = await shot(page, clip);
    await page.waitForTimeout(150);
    const still2 = await shot(page, clip);
    for (let i = 0; i <= 12; i++) await page.mouse.move(400 + i * 55, 330 + i * 22);
    await page.waitForTimeout(60);
    const stirred = await shot(page, clip);
    await page.screenshot({ path: `${SHOTS}/polish-fluid-${tag}.png` });
    const noise = await diffRegion(page, still, still2);
    const moved = await diffRegion(page, still, stirred);
    console.log(`     ${tag}: idle diff ${noise.toFixed(2)}, stirred diff ${moved.toFixed(2)}`);
    if (reduced) check(moved < noise * 2 + 1.5, `${tag}: pointer sweep leaves the frame undisturbed`);
    else check(moved > noise * 2 + 1.5, `${tag}: pointer sweep distorts the frame`);

    // Fluid decays back to rest: frame-to-frame change returns to the idle
    // baseline (the camera's own cruise keeps a little motion going).
    await page.waitForTimeout(3500);
    const s1 = await shot(page, clip);
    await page.waitForTimeout(150);
    const settled = await diffRegion(page, s1, await shot(page, clip));
    check(settled < noise * 2 + 1.5, `${tag}: fluid settles once the pointer stops (${settled.toFixed(2)})`);

    // Nav pill: visible, and Contact glides the film to the end.
    const box = await page.locator('.nav-pill').boundingBox();
    check(box && box.x + box.width <= 1440 && box.y < 60, `${tag}: nav pill sits top-right`);
    await page.click('.nav-pill a[href="#contact"]');
    await page.waitForTimeout(2500);
    const contactO = await page.$eval('#contact', (el) => parseFloat(getComputedStyle(el).opacity));
    check(contactO > 0.9, `${tag}: Contact link brings the contact beat on screen (o=${contactO})`);
    await page.screenshot({ path: `${SHOTS}/polish-contact-${tag}.png` });
    await page.click('.nav-pill a[href="#chapter-mutagen"]');
    await page.waitForTimeout(2500);
    const workO = await page.$eval('#chapter-mutagen', (el) => parseFloat(getComputedStyle(el).opacity));
    check(workO > 0.9, `${tag}: Work link brings Mutagen on screen (o=${workO})`);
    await page.screenshot({ path: `${SHOTS}/polish-work-${tag}.png` });

    // Case study: title decodes in (screen readers get the real text throughout),
    // and pulling up past the top of the dossier closes it.
    await page.click('#chapter-mutagen [data-case]');
    await page.waitForTimeout(reduced ? 150 : 1100);
    const mid = await page.$eval('#case-mutagen .case__head h2', (h) => ({
      shown: h.querySelector('[aria-hidden]')?.textContent ?? h.textContent,
      sr: h.querySelector('.sr-only')?.textContent ?? h.textContent,
    }));
    await page.screenshot({ path: `${SHOTS}/polish-case-open-${tag}.png` });
    check(mid.sr === 'MUTAGEN AI FUZZER', `${tag}: accessible title is the real text while decoding`);
    if (reduced) check(mid.shown === 'MUTAGEN AI FUZZER', `${tag}: no scramble under reduced motion`);
    else check(mid.shown !== 'MUTAGEN AI FUZZER' && mid.shown.length === 17, `${tag}: title is mid-decode ("${mid.shown}")`);
    await page.waitForTimeout(1500);
    const done = await page.$eval('#case-mutagen .case__head h2', (h) => h.textContent);
    check(done === 'MUTAGEN AI FUZZER', `${tag}: title settles on the real text`);

    // Momentum guard: scrolling up *into* the top doesn't close it...
    await page.mouse.move(720, 450);
    await page.$eval('#case-mutagen', (d) => { d.scrollTop = 400; });
    await page.waitForTimeout(100);
    for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(16); }
    await page.waitForTimeout(100);
    check(await page.$eval('#case-mutagen', (d) => d.open), `${tag}: momentum into the top doesn't close the dossier`);
    // ...but resting at the top, then pulling, does.
    await page.waitForTimeout(600);
    for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(30); }
    await page.waitForTimeout(900);
    check(!(await page.$eval('#case-mutagen', (d) => d.open)), `${tag}: pulling up past the top closes the dossier`);

    check(errors.length === 0, `${tag}: no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  });
}
