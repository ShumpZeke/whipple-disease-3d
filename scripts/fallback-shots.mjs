// Render still images of each 3D world for the no-WebGL fallback (UI hidden), then save them as
// WebP in public/fallback/.  node scripts/fallback-shots.mjs [pngDir]   (needs Python + Pillow)
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { withPreview } from './serve.mjs';

const shots = [
  ['body', 'digestive'],
  ['wall', 'tissue'],
  ['villi', 'villi'],
  ['cause', 'micro'],
  ['stain', 'diagnosis'],
];
const out = process.argv[2] ?? 'fallback-png';
mkdirSync(out, { recursive: true });
await withPreview(async (base) => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
  for (const [stop, name] of shots) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.goto(`${base}?stop=${stop}&e2e&reduced`);
    await page.waitForFunction(() => !!window.__whipple, null, { timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.addStyleTag({
      content: `.hud-top,.rail,.scroll-cue,.caption,.scale-note,.credit,.anchor-label,.lab-credit,.grain,.loading,.veil{display:none!important}`,
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${name}.png` });
    await page.close();
    console.log('saved', name);
  }
  await browser.close();
});
for (const [, name] of shots) {
  execFileSync('python', ['-c', `from PIL import Image; Image.open(r"${out}/${name}.png").convert("RGB").save(r"public/fallback/${name}.webp", quality=78, method=6)`]);
}
console.log('wrote public/fallback/*.webp');
