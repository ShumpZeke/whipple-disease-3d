// Record the whole zoom as a video (a backup for presenting on a computer without WebGL).
//   node scripts/record-tour.mjs [out.mp4] [width] [height] [secondsPerStop]
// Needs ffmpeg on the PATH to convert Playwright's WebM recording to MP4.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { withPreview } from './serve.mjs';

const [out = 'whipple-tour.mp4', w = '1280', h = '720', hold = '2.2'] = process.argv.slice(2);
const size = { width: +w, height: +h };
const dir = mkdtempSync(join(tmpdir(), 'whipple-tour-'));
let skip = 0;

await withPreview(async (base) => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
  const context = await browser.newContext({ viewport: size, recordVideo: { dir, size } });
  const page = await context.newPage();
  const t0 = Date.now();
  await page.goto(`${base}?e2e`);
  await page.waitForFunction(() => !!window.__whipple, null, { timeout: 60000 });
  // visit every scene once so all shaders are compiled before the tour starts
  for (const t of [4, 6, 7, 8, 10, 11, 12, 13, 15, 0]) {
    await page.evaluate((t) => window.scrollTo(0, t * innerHeight), t);
    await page.waitForTimeout(t === 4 ? 5000 : 1500);
  }
  await page.reload();
  await page.waitForTimeout(3500);
  skip = (Date.now() - t0) / 1000 - 3.2;
  const stops = await page.evaluate(() => document.querySelectorAll('.rail__stop').length);
  for (let i = 1; i < stops; i++) {
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(1700 + +hold * 1000);
  }
  await page.waitForTimeout(1500);
  await context.close();
  await browser.close();
});

const webm = join(dir, readdirSync(dir).find((f) => f.endsWith('.webm')));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', skip.toFixed(2), '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', resolve(out)]);
rmSync(dir, { recursive: true, force: true });
console.log('saved', resolve(out));
