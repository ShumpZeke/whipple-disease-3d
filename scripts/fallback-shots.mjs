// Render still images of each 3D world for the no-WebGL fallback (UI hidden).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { withPreview } from './serve.mjs';
const shots = [
  ['overview', 0, 'digestive'],
  ['inside', 0, 'tissue'],
  ['villi', 0, 'villi'],
  ['micro', 0, 'micro'],
  ['diagnosis', 1, 'diagnosis'],
];
const out = process.argv[2] ?? 'fallback-png';
mkdirSync(out, { recursive: true });
await withPreview(async (base) => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
  for (const [step, sub, name] of shots) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.goto(`${base}?step=${step}&sub=${sub}&e2e&reduced`);
    await page.waitForTimeout(7000);
    await page.addStyleTag({
      content: `.hud-top,.hud-bottom,.caption,.scale-note,.credit,.anchor-label,.lab-credit,.grain,.loading{display:none!important}`,
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${name}.png` });
    await page.close();
    console.log('saved', name);
  }
  await browser.close();
});
