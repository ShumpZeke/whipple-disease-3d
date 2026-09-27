// Walk the whole story with the keyboard in headless Chromium (GPU via ANGLE) and save a
// screenshot of every step (serves dist/ temporarily).
//   node scripts/shots.mjs [outDir] [width] [height]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { withPreview } from './serve.mjs';

const [outDir = 'shots', w = '1600', h = '900'] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

await withPreview(async (base) => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'],
  });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text().slice(0, 240)}`);
  });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(`${base}?e2e`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${outDir}/00-intro.png` });
  const total = 18;
  let prev = '';
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600);
    const st = await page.evaluate(() => window.__whipple?.state?.() ?? null);
    const id = await page.evaluate(
      () => document.querySelector('[data-step]')?.getAttribute('data-step') ?? document.querySelector('.wordmark__chapter')?.textContent ?? '',
    );
    const key = `${st?.step ?? 'x'}-${st?.sub ?? 0}`;
    if (key === prev) break;
    prev = key;
    for (let k = 0; k < 60; k++) {
      const busy = await page.evaluate(
        () => document.querySelector('.veil')?.classList.contains('is-on') || !!document.querySelector('.loading'),
      );
      if (!busy) break;
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(st && st.step === 5 ? 6200 : 2600);
    const name = `${String(st?.step ?? i).padStart(2, '0')}-${st?.sub ?? 0}-${(id || 'step').replace(/[^a-z0-9]+/gi, '_').slice(0, 30)}`;
    await page.screenshot({ path: `${outDir}/${name}.png` });
    console.log('shot', name);
    if (st && st.step >= total - 1) break;
  }
  console.log(logs.filter((l) => !/Clock: This module has been deprecated|X4122/.test(l)).join('\n') || 'no console errors/warnings');
  await browser.close();
});
