// Render the 3D digestive system as a transparent still for the home screen (public/cover/).
//   node scripts/cover-art.mjs      (needs Python + Pillow for the crop / WebP step)
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { withPreview } from './serve.mjs';

const png = join(tmpdir(), 'whipple-cover.png');
mkdirSync('public/cover', { recursive: true });
await withPreview(async (base) => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
  // an upright window frames the model centred and large
  const page = await browser.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 1.5 });
  await page.goto(`${base}?stop=body&e2e&reduced`);
  await page.waitForFunction(() => !!window.__whipple, null, { timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.addStyleTag({
    content: `html,body,#root,.exhibit{background:transparent!important}
      .exhibit>*:not(.canvas-layer),.anchor-label,.endnotes{display:none!important}`,
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: png, omitBackground: true });
  await browser.close();
});
execFileSync('python', [
  '-c',
  `from PIL import Image
im = Image.open(r"${png}").convert("RGBA")
box = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
im = im.crop(box)
im.thumbnail((900, 1300), Image.LANCZOS)
im.save("public/cover/digestive.webp", quality=86, method=6)
print("cover", im.size)`,
]);
