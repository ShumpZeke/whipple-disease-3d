// Capture the 1907 plate → modern model transition at several moments.
import { chromium } from '@playwright/test';
import { withPreview } from './serve.mjs';
const out = process.argv[2] ?? 'hinge';
await withPreview(async (base) => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(`${base}?step=correction&e2e`);
  await page.waitForTimeout(6000); // let the stage load + compile in the background
  await page.keyboard.press('ArrowRight');
  for (const t of [300, 1400, 2600, 3600, 5200]) {
    await page.waitForTimeout(t - (t > 300 ? [300, 1400, 2600, 3600, 5200][[300, 1400, 2600, 3600, 5200].indexOf(t) - 1] : 0));
    await page.screenshot({ path: `${out}-${t}.png` });
  }
  await browser.close();
});
