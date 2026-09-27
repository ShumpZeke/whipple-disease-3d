// Dev probe: serve dist/ temporarily, load one step in headless Chromium (GPU via ANGLE) and
// report timings, console output and a screenshot.  Usage:
//   node scripts/probe.mjs [step] [sub] [width] [height] [out.png]
import { chromium } from '@playwright/test';
import { withPreview } from './serve.mjs';

const [step = 'overview', sub = '0', w = '1600', h = '900', out = 'probe.png'] = process.argv.slice(2);

await withPreview(async (base) => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'],
  });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  const t0 = Date.now();
  await page.goto(`${base}?step=${step}&sub=${sub}&e2e`);
  let ready = -1;
  for (let i = 0; i < 300; i++) {
    const s = await page.evaluate(() => ({
      loading: !!document.querySelector('.loading'),
      hidden: document.querySelector('.canvas-layer')?.classList.contains('is-hidden') ?? true,
      veil: document.querySelector('.veil')?.classList.contains('is-on') ?? false,
    }));
    if (!s.loading && !s.hidden && !s.veil) {
      ready = Date.now() - t0;
      break;
    }
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const gl = c?.getContext('webgl2');
    const dbg = gl?.getExtension('WEBGL_debug_renderer_info');
    return {
      renderer: gl && dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null,
      state: window.__whipple?.state(),
      render: window.__whipple?.renderInfo(),
    };
  });
  await page.screenshot({ path: out });
  console.log(JSON.stringify({ step, readyMs: ready, ...info }, null, 1));
  console.log(logs.filter((l) => !/Clock: This module has been deprecated|X4122/.test(l)).join('\n'));
  await browser.close();
});
