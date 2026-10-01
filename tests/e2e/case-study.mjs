import { withPage, check, scrollToProgress, BASE, SHOTS } from './lib.mjs';

await withPage({ viewport: { width: 1600, height: 1000 } }, async (page, errors) => {
  for (const [id, at] of [['mutagen', 0.33], ['vigil', 0.46], ['proving-grounds', 0.72]]) {
    await scrollToProgress(page, at);
    const before = await page.evaluate(() => scrollY);
    await page.click(`#chapter-${id} [data-case]`);
    await page.waitForTimeout(700);
    check(await page.$eval(`#case-${id}`, (d) => d.open), `${id} dialog opens`);
    check(page.url().endsWith(`#${id}`), `${id} sets the shareable hash`);
    await page.screenshot({ path: `${SHOTS}/case-${id}.png` });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    check(!(await page.$eval(`#case-${id}`, (d) => d.open)), `${id} closes on ESC`);
    check(Math.abs((await page.evaluate(() => scrollY)) - before) < 4, `${id} returns to the same spot in the descent`);
  }
  await scrollToProgress(page, 0.33);
  await page.click('#chapter-mutagen [data-case]');
  await page.waitForTimeout(3500);
  const readout = await page.$eval('#case-mutagen [data-phase-readout]', (el) => el.textContent);
  check(/PHASE 2\/5/.test(readout), `phase-flow pulse advances inside the dialog ("${readout}")`);
  const typed = await page.$eval('#case-mutagen .command-block-code', (el) => el.textContent.length);
  check(typed > 20, 'command typewriter runs inside the dialog');
  await page.keyboard.press('Escape');

  await scrollToProgress(page, 0.72);
  await page.click('#chapter-proving-grounds [data-case]');
  await page.waitForTimeout(500);
  await page.click('#case-proving-grounds .target-btn[data-machine="linux"]');
  check((await page.textContent('#case-proving-grounds #ctfMachineContent')).includes('CYBERPULSE'), 'CTF tabs switch writeups');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  // Opening is choreographed: the camera dives first (text falls away), the
  // dossier opens a beat later, and closing restores the descent.
  await scrollToProgress(page, 0.46, 1500);
  await page.click('#chapter-vigil [data-case]');
  await page.waitForTimeout(120);
  const mid = await page.evaluate(() => ({ diving: document.documentElement.classList.contains('case-diving'), open: document.getElementById('case-vigil').open }));
  check(mid.diving && !mid.open, `transition: camera dives before the dossier opens (${JSON.stringify(mid)})`);
  await page.waitForTimeout(900);
  check(await page.$eval('#case-vigil', (d) => d.open), 'transition: dossier open after the dive');
  await page.click('#case-vigil [data-close]');
  await page.waitForTimeout(150);
  check(await page.$eval('#case-vigil', (d) => d.open && d.classList.contains('is-closing')), 'transition: close animates out before the dialog closes');
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => ({ diving: document.documentElement.classList.contains('case-diving'), open: document.getElementById('case-vigil').open, o: getComputedStyle(document.querySelector('.track')).opacity }));
  check(!after.diving && !after.open && after.o === '1', `transition: descent restored after close (${JSON.stringify(after)})`);
  check(errors.length === 0, `no console errors ${JSON.stringify(errors)}`);
});

await withPage({ viewport: { width: 390, height: 844 } }, async (page) => {
  await page.goto(BASE + '#vigil', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  check(await page.$eval('#case-vigil', (d) => d.open), 'deep link #vigil opens the Vigil case study on load (mobile)');
  await page.screenshot({ path: `${SHOTS}/case-vigil-mobile.png` });
});
