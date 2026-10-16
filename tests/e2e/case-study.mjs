// Full dossiers (<dialog>), opened from a project's detail view.
import { withPage, check, BASE, SHOTS } from './lib.mjs';

const openDetail = async (page, id) => { await page.goto(`${BASE}#/work/${id}`); await page.waitForTimeout(1400); };

await withPage({ viewport: { width: 1600, height: 1000 } }, async (page, errors) => {
  for (const id of ['mutagen', 'vigil', 'proving-grounds', 'signalhub', 'who']) {
    await openDetail(page, id);
    await page.click('.detail__dossier');
    await page.waitForTimeout(800);
    check(await page.$eval(`#case-${id}`, (d) => d.open), `${id}: "Open full dossier" opens its dialog`);
    await page.screenshot({ path: `${SHOTS}/case-${id}.png` });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    check(!(await page.$eval(`#case-${id}`, (d) => d.open)), `${id}: closes on Escape`);
    check(page.url().endsWith(`#/work/${id}`) && await page.evaluate(() => document.documentElement.dataset.view) === 'detail', `${id}: closing returns to the project detail`);
  }

  await openDetail(page, 'mutagen');
  await page.click('.detail__dossier');
  await page.waitForTimeout(3500);
  const readout = await page.$eval('#case-mutagen [data-phase-readout]', (el) => el.textContent);
  check(/PHASE 2\/5/.test(readout), `phase-flow pulse advances inside the dialog ("${readout}")`);
  const typed = await page.$eval('#case-mutagen .command-block-code', (el) => el.textContent.length);
  check(typed > 20, 'command typewriter runs inside the dialog');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  // No fabricated machine writeups (removed 2026-10-02).
  await openDetail(page, 'proving-grounds');
  await page.click('.detail__dossier');
  await page.waitForTimeout(600);
  check(await page.$('#case-proving-grounds #ctfMachineContent') === null, 'no fabricated CTF writeup console');
  check(!(await page.textContent('#case-proving-grounds')).toLowerCase().includes('writeup'), 'proving-grounds claims no writeups');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  // Opening is choreographed: the dive first, the dossier a beat later.
  await openDetail(page, 'vigil');
  await page.click('.detail__dossier');
  await page.waitForTimeout(120);
  const mid = await page.evaluate(() => ({ diving: document.documentElement.classList.contains('case-diving'), open: document.getElementById('case-vigil').open }));
  check(mid.diving && !mid.open, `transition: the dive comes before the dossier (${JSON.stringify(mid)})`);
  await page.waitForTimeout(900);
  check(await page.$eval('#case-vigil', (d) => d.open), 'transition: dossier open after the dive');
  await page.click('#case-vigil [data-close]');
  await page.waitForTimeout(150);
  check(await page.$eval('#case-vigil', (d) => d.open && d.classList.contains('is-closing')), 'transition: close animates out before the dialog closes');
  await page.waitForTimeout(700);
  check(!(await page.$eval('#case-vigil', (d) => d.open)) && !(await page.evaluate(() => document.documentElement.classList.contains('case-diving'))), 'transition: dive undone after close');
  check(errors.length === 0, `no console errors ${JSON.stringify(errors)}`);
});

// Old share links (#vigil) still open that dossier, now over its detail view.
await withPage({ viewport: { width: 390, height: 844 } }, async (page) => {
  await page.goto(BASE + '#vigil', { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  check(await page.$eval('#case-vigil', (d) => d.open), 'legacy deep link #vigil opens the Vigil dossier (mobile)');
  check(await page.evaluate(() => document.documentElement.dataset.view) === 'detail', 'legacy deep link lands on the project detail underneath');
  await page.screenshot({ path: `${SHOTS}/case-vigil-mobile.png` });
});
