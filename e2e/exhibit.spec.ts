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

test('opens on a home screen that introduces the eponym and guides the viewer', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?e2e');
  await expect(page.getByRole('heading', { name: 'Whipple’s Disease', level: 1 })).toBeVisible();
  const cover = page.locator('.cover');
  await expect(cover).toContainText('Whipple disease'); // the modern spelling
  await expect(cover.locator('.cover__def')).toContainText('small intestine');
  await expect(cover.locator('.cover__by')).toContainText('Vardhmansinh Rathod');
  await expect(cover.locator('.cover__by')).toContainText('3rd Block');
  await expect(cover.getByRole('button', { name: /Start/ })).toBeVisible();
  // the "What's inside" menu jumps straight to a part
  const menu = page.getByRole('navigation', { name: 'What’s inside' });
  await expect(menu.getByRole('button')).toHaveCount(5);
  await waitForStage(page);
  await menu.getByRole('button', { name: /Four facts/ }).click();
  await expect.poll(async () => (await state(page))?.id).toBe('cause');
  expect(errors).toEqual([]);
});

test('the history begins with a profile of George Hoyt Whipple', async ({ page }) => {
  await page.goto('/?stop=doctor');
  const card = page.getByRole('article', { name: 'Profile of George Hoyt Whipple' });
  await expect(card).toBeVisible();
  for (const year of ['1878', '1905', '1907', '1934']) await expect(card).toContainText(year);
  await expect(page.locator('section.caption[data-step="doctor"] .keyterm')).toContainText('Pathology');
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
  await expect(page.locator('.quiz__prompt')).toContainText('tap the organ');
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

test.describe('on a smart board (1920×1080 touch screen)', () => {
  test.use({ viewport: { width: 1920, height: 1080 }, hasTouch: true });

  test('big text, big Back/Next buttons and swiping', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/?e2e');
    await waitForStage(page);
    // text sized for the back of a classroom
    await page.getByRole('button', { name: 'Next', exact: true }).tap();
    await expect.poll(async () => (await state(page))?.id).toBe('doctor');
    const title = page.locator('section.caption[data-step="doctor"] .caption__title');
    await expect(title).toBeVisible();
    expect(parseFloat(await title.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(56);
    const body = page.locator('section.caption[data-step="doctor"] .caption__body');
    expect(parseFloat(await body.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(24);
    await expect(page.locator('section.caption[data-step="doctor"] .keyterm')).toContainText('Pathology');
    // two quick taps move two stops
    const next = page.getByRole('button', { name: 'Next', exact: true });
    await next.tap();
    await next.tap();
    await expect.poll(async () => (await state(page))?.id).toBe('name');
    await page.getByRole('button', { name: 'Back', exact: true }).tap();
    await expect.poll(async () => (await state(page))?.id).toBe('case');
    await expect(page.locator('.pnav__count')).toContainText(`3 / ${STOPS.length}`);
    // big enough to hit with a finger
    const box = (await next.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(56);
    // a finger swipe up zooms on to the next stop and comes to rest there; a tiny swipe falls back
    await expect.poll(async () => Math.abs(((await state(page))?.t ?? 0) - 2)).toBeLessThan(0.01);
    const cdp = await page.context().newCDPSession(page);
    const swipe = async (x: number, y: number, dy: number) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let i = 1; i <= 12; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + (dy * i) / 12 }] });
        await page.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    await swipe(1300, 900, -420);
    await expect.poll(async () => (await state(page))?.id).toBe('name');
    await expect.poll(async () => Math.abs(((await state(page))?.t ?? 0) - 3)).toBeLessThan(0.01);
    await swipe(1300, 500, 60);
    await page.waitForTimeout(1500);
    await expect.poll(async () => Math.abs(((await state(page))?.t ?? 0) - 3)).toBeLessThan(0.01);
    await expect(page.getByRole('button', { name: /Full screen/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('the summary leads on to the list of sources', async ({ page }) => {
    await page.goto('/?stop=end&e2e');
    await waitForStage(page);
    await expect(page.locator('section.caption[data-step="end"] .facts li')).toHaveCount(4);
    await page.getByRole('button', { name: 'Next: sources' }).tap();
    const sources = page.locator('#sources');
    await expect.poll(async () => Math.abs((await sources.boundingBox())?.y ?? 999)).toBeLessThan(4);
    await expect(sources.getByRole('heading', { name: 'Sources' })).toBeVisible();
    expect(await sources.locator('.endnotes__refs li').count()).toBe(17);
    await expect(sources.locator('.endnotes__terms')).toContainText('Malabsorption');
    await expect(sources.locator('.endnotes__credits')).toContainText('BodyParts3D');
    await expect(sources).toContainText('Vardhmansinh Rathod');
    // stepping back from the top of the list returns to the summary
    await page.keyboard.press('PageUp');
    await expect.poll(async () => Math.round(await page.evaluate(() => window.scrollY / innerHeight))).toBe(STOPS.length - 1);
  });
});

test('the printable presenter guide has a script for every stop and the quiz answers', async ({ page }) => {
  await page.goto('/?guide');
  await expect(page.getByRole('heading', { name: 'Whipple’s Disease', level: 1 })).toBeVisible();
  await expect(page.locator('.guide__stop')).toHaveCount(STOPS.length);
  await expect(page.locator('.guide__say')).toHaveCount(STOPS.length);
  await expect(page.locator('.guide__answers li')).toHaveCount(QUESTIONS.length);
  await expect(page.locator('.guide__answers')).toContainText('the small intestine');
});
