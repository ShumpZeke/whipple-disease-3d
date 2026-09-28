import { expect, test, type Page } from '@playwright/test';
import { QUESTIONS } from '../src/content/quiz';
import { LAST_STOP, STOPS } from '../src/content/story';

// Known noise from three.js / the GPU driver, not from the exhibit.
const IGNORED = /THREE\.Clock|X4122|GPU stall|software WebGL|GL Driver Message|WebGL: too many errors/;

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORED.test(m.text())) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

const state = (page: Page) => page.evaluate(() => window.__whipple?.state());
const waitForStage = (page: Page) => page.waitForFunction(() => !!window.__whipple, null, { timeout: 60_000 });

test('opens in 1907 with the student credit', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Scroll to zoom in/ })).toBeVisible();
  await expect(page.locator('.credit')).toContainText('Vardhmansinh Rathod');
  await expect(page.locator('.credit')).toContainText('Period');
  expect(errors).toEqual([]);
});

test('one continuous page: a presenter clicker walks every stop in order', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?e2e');
  await waitForStage(page);
  for (let i = 1; i <= LAST_STOP; i++) {
    await page.keyboard.press('PageDown');
    await expect.poll(async () => (await state(page))?.id, { message: `stop ${i}` }).toBe(STOPS[i].id);
    await expect.poll(async () => Math.abs(((await state(page))?.t ?? 0) - i)).toBeLessThan(0.01);
    await expect(page.locator(`section.caption[data-step="${STOPS[i].id}"]`)).toBeVisible();
  }
  // it is one long scrolling page, not a slide deck
  expect(Math.round(await page.evaluate(() => window.scrollY / innerHeight))).toBe(LAST_STOP);
  await page.keyboard.press('PageUp');
  await expect.poll(async () => (await state(page))?.id).toBe(STOPS[LAST_STOP - 1].id);
  await page.keyboard.press('Home');
  await expect.poll(async () => (await state(page))?.id).toBe('title');
  expect(errors).toEqual([]);
});

test('the mouse wheel zooms in', async ({ page }) => {
  await page.goto('/?e2e');
  await waitForStage(page);
  await page.mouse.move(800, 450);
  for (let k = 0; k < 4; k++) {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(250);
  }
  await expect.poll(async () => (await state(page))?.t ?? 0).toBeGreaterThan(2);
});

test('the small-intestine marker zooms into the organ', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?stop=body&e2e');
  await waitForStage(page);
  const marker = page.getByRole('button', { name: 'Zoom into the small intestine' });
  await expect(marker).toBeVisible();
  await marker.click();
  await expect.poll(async () => (await state(page))?.id).toBe('intestine');
  expect(errors).toEqual([]);
});

test('self-check: pick the organ on the 3D model, then answer the questions', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?stop=quiz&e2e');
  await waitForStage(page);
  await expect(page.locator('.quiz__prompt')).toContainText('select the organ');
  await page.waitForTimeout(800);
  const pt = await page.evaluate(() => window.__whipple!.organPoint('SmallIntestine'));
  expect(pt).not.toBeNull();
  await page.mouse.click(pt!.x, pt!.y);
  await expect(page.locator('.quiz__feedback')).toHaveClass(/is-right/);
  await page.getByRole('button', { name: 'Next question' }).click();
  for (const q of QUESTIONS.slice(1)) {
    if (q.kind !== 'choice') continue;
    const wrong = q.options.find((o) => !o.correct)!;
    await page.getByRole('button', { name: wrong.text, exact: true }).click();
    await expect(page.locator('.quiz__feedback')).toHaveClass(/is-wrong/);
    await page.getByRole('button', { name: q.options.find((o) => o.correct)!.text, exact: true }).click();
    await expect(page.locator('.quiz__feedback')).toHaveClass(/is-right/);
    await page.getByRole('button', { name: /Next question|See results/ }).click();
  }
  await expect(page.locator('[data-quiz="done"]')).toContainText('Nicely done');
  expect(errors).toEqual([]);
});

test('sources, medical terms and inline definitions', async ({ page }) => {
  await page.goto('/?stop=doctor');
  await page.locator('.hud-links').getByRole('button', { name: 'Sources' }).click();
  const sources = page.getByRole('dialog', { name: 'Sources' });
  await expect(sources).toBeVisible();
  expect(await sources.locator('.ref').count()).toBeGreaterThanOrEqual(3);
  await page.keyboard.press('Escape');
  await expect(sources).toBeHidden();

  await page.locator('.hud-links').getByRole('button', { name: 'Terms' }).click();
  await expect(page.getByRole('dialog', { name: 'Medical terms' })).toBeVisible();
  await page.keyboard.press('Escape');

  const caption = page.locator('section.caption[data-step="doctor"]');
  await caption.locator('.term').first().click();
  await expect(page.locator('.popover')).toBeVisible();
  await page.keyboard.press('Escape');
  await caption.locator('.cite').first().click();
  await expect(page.locator('.ref.is-focus')).toBeVisible();
});

test('the history stop shows the name correction', async ({ page }) => {
  await page.goto('/?stop=name');
  const note = page.locator('section.caption[data-step="name"] .caption__note');
  await expect(note).toContainText('Allen O. Whipple');
  await expect(note).toContainText('George Hoyt Whipple');
});

test('reduced motion jumps between stops without the zoom animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?stop=wall&e2e');
  await waitForStage(page);
  await page.keyboard.press('PageDown');
  await page.waitForTimeout(150);
  expect((await state(page))?.id).toBe('villi');
  expect(Math.abs(((await state(page))?.t ?? 0) - STOPS.findIndex((s) => s.id === 'villi'))).toBeLessThan(0.001);
});

test('falls back to still images when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error — test override
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      if (/webgl/i.test(type)) return null;
      return orig.call(this, type, ...rest);
    };
  });
  await page.goto('/?stop=villi');
  await expect(page.locator('.fallback-img img')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Interactive 3D isn’t available' })).toBeVisible();
  await expect(page.locator('section.caption[data-step="villi"]')).toBeVisible();
});

for (const vp of [
  { name: 'laptop 1366×768', width: 1366, height: 768 },
  { name: 'phone 390×844', width: 390, height: 844 },
]) {
  test(`fits the screen on a ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/?stop=symptoms&e2e');
    await waitForStage(page);
    const caption = page.locator('section.caption[data-step="symptoms"]');
    await expect(caption).toBeVisible();
    const box = (await caption.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width);
  });
}
