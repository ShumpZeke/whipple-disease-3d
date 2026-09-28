// Scroll through the one-page journey in headless Chromium and capture frames at given
// positions (stop indices, fractions = mid-zoom).  node scripts/journey-shots.mjs outDir [w] [h] [t,t,...] [lite]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { withPreview } from './serve.mjs';

const [outDir = 'journey', w = '1600', h = '900', list, extra] = process.argv.slice(2);
const ts = list ? list.split(',').map(Number) : [0, 0.5, 1, 2, 3, 3.35, 3.6, 3.8, 4, 5, 5.3, 5.5, 5.7, 6, 7, 7.5, 8, 8.5, 9, 10, 10.5, 11, 12, 13, 13.7, 14, 15, 16];
mkdirSync(outDir, { recursive: true });
await withPreview(async (base) => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text().slice(0, 200)}`);
  });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(`${base}?e2e&nosettle${extra ? `&${extra}` : ''}`); // nosettle: let the page rest between stops
  // warm up: visit the deep scenes so every world mounts and compiles
  for (const t of [4, 6, 7, 8, 11, 12, 13, 0]) {
    await page.evaluate((t) => window.scrollTo(0, t * innerHeight), t);
    await page.waitForTimeout(t === 4 ? 6000 : 1800);
  }
  for (const t of ts) {
    await page.evaluate((t) => window.scrollTo(0, t * innerHeight), t);
    await page.waitForTimeout(1600);
    const st = await page.evaluate(() => window.__whipple?.state?.());
    await page.screenshot({ path: `${outDir}/t${String(t.toFixed(2)).padStart(5, '0')}.png` });
    console.log('t', t, JSON.stringify(st));
  }
  console.log(logs.filter((l) => !/Clock: This module has been deprecated|X4122/.test(l)).join('\n') || 'no console errors/warnings');
  await browser.close();
});
