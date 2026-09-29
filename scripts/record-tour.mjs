// Record the whole zoom as a video (a backup for presenting on a computer without WebGL), ending
// with the quick check played through: each question, a moment to think, then the right answer.
//   node scripts/record-tour.mjs [out.mp4] [width] [height] [secondsPerStop]
// Needs ffmpeg on the PATH to convert Playwright's WebM recording to MP4.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { withPreview } from './serve.mjs';

const [out = 'wilms-tour.mp4', w = '1280', h = '720', hold = '2.2'] = process.argv.slice(2);
const size = { width: +w, height: +h };
const dir = mkdtempSync(join(tmpdir(), 'exhibit-tour-'));
let skip = 0;

await withPreview(async (base) => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
  const context = await browser.newContext({ viewport: size, recordVideo: { dir, size } });
  const page = await context.newPage();
  const t0 = Date.now();
  await page.goto(`${base}?e2e`);
  // the stage compiles every shader and draws the key moments once before it shows itself
  await page.waitForSelector('.canvas-layer.is-ready', { timeout: 120000 });
  await page.waitForTimeout(1500);
  skip = (Date.now() - t0) / 1000 - 1.2;
  const stops = await page.evaluate(() => document.querySelectorAll('.scroller .snap').length);
  await page.waitForTimeout(+hold * 1000); // the home screen
  for (let i = 1; i < stops; i++) {
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(1700 + +hold * 1000);
  }
  // the quick check at the end
  for (;;) {
    const a = await page.evaluate(() => window.__exhibit.quizAnswer());
    if (!a) break;
    await page.waitForTimeout(2600);
    if (a.kind === 'organ') {
      const pt = await page.evaluate(() => window.__exhibit.organPoint('LeftKidney'));
      await page.mouse.move(pt.x - 60, pt.y + 40);
      await page.mouse.click(pt.x, pt.y);
    } else {
      await page.getByRole('button', { name: a.text, exact: true }).click();
    }
    await page.waitForTimeout(2800);
    // move the pointer to empty space so no hover hint is left on screen
    await page.mouse.move(size.width - 40, size.height - 40);
    await page.getByRole('button', { name: /Next question|See how you did/ }).click();
    await page.mouse.move(size.width - 40, size.height - 40);
    await page.waitForTimeout(700);
  }
  await page.waitForTimeout(4000);
  await context.close();
  await browser.close();
});

const webm = join(dir, readdirSync(dir).find((f) => f.endsWith('.webm')));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', skip.toFixed(2), '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', resolve(out)]);
rmSync(dir, { recursive: true, force: true });
console.log('saved', resolve(out));
