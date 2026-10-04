import { expect, test, type Page } from '@playwright/test';
import { answerOf, QUESTIONS } from '../src/content/quiz';
import { LAST_STOP, PAUSES, SECTIONS, SOURCES_PAGE, STOPS } from '../src/content/story';
import { SOURCES } from '../src/content/citations';

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

const state = (page: Page) => page.evaluate(() => window.__exhibit?.state());
const waitForStage = (page: Page) => page.waitForFunction(() => !!window.__exhibit, null, { timeout: 60_000 });

test('opens on a home screen that introduces the eponym and guides the viewer', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?e2e');
  await expect(page.getByRole('heading', { name: 'Wilms Tumor', level: 1 })).toBeVisible();
  const cover = page.locator('.cover');
  await expect(cover).toContainText('nephroblastoma'); // the other name
  await expect(cover.locator('.cover__def')).toContainText('kidney cancer');
  await expect(cover.locator('.cover__brand')).toContainText('Vardhmansinh Rathod');
  await expect(cover.locator('.cover__brand')).toContainText('Eren Robinson');
  await expect(cover.locator('.cover__brand')).toContainText('Shanya Prezy');
  await expect(cover.locator('.cover__brand')).toContainText('3rd Block');
  // kept short: a title, one line, the names and the list of parts
  await expect(cover.locator('p')).toHaveCount(2);
  // a pure scene: no slide buttons, arrows or counters
  await expect(page.getByRole('button', { name: /^(Next|Back|Start)$/ })).toHaveCount(0);
  // the list of parts jumps straight to one
  const menu = page.getByRole('navigation', { name: 'What’s inside' });
  await expect(menu.getByRole('button')).toHaveCount(SECTIONS.length);
  await waitForStage(page);
  await menu.getByRole('button', { name: /The cause/ }).click();
  await expect.poll(async () => (await state(page))?.id).toBe('genes');
  expect(errors).toEqual([]);
});

test('the history begins with a profile of Max Wilms at his desk, then his 1899 book', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?stop=doctor&e2e');
  await waitForStage(page);
  // the profile hangs in the room next to him (a label pinned in the 3D scene)
  const card = page.getByRole('article', { name: 'Profile of Max Wilms' });
  await expect(card).toBeVisible();
  for (const year of ['1867', '1899', '1904', '1918']) await expect(card).toContainText(year);
  await expect(page.locator('section.caption[data-step="doctor"] .caption__body')).toContainText('German surgeon');

  // scrolling on zooms over his shoulder to the book on his desk; the profile goes with the room
  await page.keyboard.press('PageDown');
  await expect.poll(async () => (await state(page))?.id).toBe('name');
  await expect(page.locator('section.caption[data-step="name"] .caption__body')).toContainText('nephroblastoma');
  await expect(card).toBeHidden();
  expect(errors).toEqual([]);
});

test('the name stop splits nephroblastoma into its word parts', async ({ page }) => {
  await page.goto('/?stop=name&e2e');
  await waitForStage(page);
  const card = page.getByRole('article', { name: 'The word parts of nephroblastoma' });
  await expect(card).toBeVisible();
  for (const part of ['kidney', 'young cell', 'tumor']) await expect(card).toContainText(part);
  await expect(page.locator('section.caption[data-step="name"] .caption__note')).toContainText('Nephr means kidney');
});

test('one continuous page: a presenter clicker walks the talk, flying through the rest', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?e2e');
  await waitForStage(page);
  expect(PAUSES.length).toBe(10);
  for (const i of PAUSES.slice(1)) {
    await page.keyboard.press('PageDown');
    await expect.poll(async () => (await state(page))?.id, { message: `stop ${i}` }).toBe(STOPS[i].id);
    await expect.poll(async () => Math.abs(((await state(page))?.t ?? 0) - i)).toBeLessThan(0.01);
    await expect(page.locator(`section.caption[data-step="${STOPS[i].id}"]`)).toBeVisible();
  }
  // it is one long scrolling page, not a slide deck
  expect(Math.round(await page.evaluate(() => window.scrollY / innerHeight))).toBe(LAST_STOP);
  await page.keyboard.press('PageUp');
  await expect.poll(async () => (await state(page))?.id).toBe(STOPS[PAUSES.at(-2)!].id);
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

test('the kidney marker zooms in on the kidneys', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?stop=body&e2e');
  await waitForStage(page);
  const marker = page.getByRole('button', { name: 'Zoom in on the kidneys' });
  await expect(marker).toBeVisible();
  await marker.click();
  await expect.poll(async () => (await state(page))?.id).toBe('kidneys');
  expect(errors).toEqual([]);
});

test('the quiz: five big multiple-choice questions, one try each, then the results', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?stop=quiz&e2e');
  await waitForStage(page);
  // question 1 wrong: the pick turns red, the right answer green, and a second click changes nothing
  await expect(page.locator('.quiz__prompt')).toHaveText(QUESTIONS[0].prompt);
  expect(parseFloat(await page.locator('.quiz__prompt').evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(40);
  const wrong = QUESTIONS[0].options.find((o) => !o.correct)!.text;
  await page.getByRole('button', { name: wrong }).click();
  await expect(page.locator('.quiz__opt.is-wrong')).toContainText(wrong);
  await expect(page.locator('.quiz__opt.is-right')).toContainText(answerOf(QUESTIONS[0]));
  await expect(page.locator('.quiz__feedback')).toHaveClass(/is-wrong/);
  await page.getByRole('button', { name: 'Next question' }).click();
  // the other four right
  for (const q of QUESTIONS.slice(1)) {
    await expect(page.locator('.quiz__prompt')).toHaveText(q.prompt);
    await page.getByRole('button', { name: answerOf(q) }).click();
    await expect(page.locator('.quiz__feedback')).toHaveClass(/is-right/);
    await page.getByRole('button', { name: /Next question|See my results/ }).click();
  }
  const done = page.locator('[data-quiz="done"]');
  await expect(done.locator('.quiz__score')).toContainText('4');
  await expect(done).toContainText('80% correct');
  await expect(done.locator('.quiz__review li.is-wrong')).toHaveCount(1);
  await expect(done.locator('.quiz__review li.is-right')).toHaveCount(4);
  // and it can be taken again
  await done.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.quiz__prompt')).toHaveText(QUESTIONS[0].prompt);
  expect(errors).toEqual([]);
});

test('sources, medical terms and inline definitions', async ({ page }) => {
  await page.goto('/?stop=name');
  // after the home screen the corner menu hides until the mouse comes near the top
  await page.mouse.move(800, 400);
  await page.mouse.move(800, 30);
  await page.locator('.hud-links').getByRole('button', { name: 'References' }).click();
  const sources = page.getByRole('dialog', { name: 'References' });
  await expect(sources).toBeVisible();
  expect(await sources.locator('.ref').count()).toBe(SOURCES.length);
  await page.keyboard.press('Escape');
  await expect(sources).toBeHidden();

  await page.mouse.move(800, 400);
  await page.mouse.move(800, 30);
  await page.locator('.hud-links').getByRole('button', { name: 'Terms' }).click();
  await expect(page.getByRole('dialog', { name: 'Medical terms' })).toBeVisible();
  await page.keyboard.press('Escape');

  const caption = page.locator('section.caption[data-step="name"]');
  await caption.locator('.term').first().click();
  await expect(page.locator('.popover')).toBeVisible();
  await expect(page.locator('.popover')).toContainText('kidney');
  await page.keyboard.press('Escape');
  await caption.locator('.cite').first().click();
  await expect(page.locator('.ref.is-focus')).toBeVisible();
});

test('reduced motion jumps between stops without the zoom animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?stop=body&e2e');
  await waitForStage(page);
  await page.keyboard.press('PageDown');
  await page.waitForTimeout(150);
  expect((await state(page))?.id).toBe('genes');
  expect(Math.abs(((await state(page))?.t ?? 0) - STOPS.findIndex((s) => s.id === 'genes'))).toBeLessThan(0.001);
});

test('lite mode (?lite) runs the same exhibit', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?e2e&lite&stop=genes');
  await waitForStage(page);
  expect((await state(page))?.quality).toBe('lite');
  await expect(page.locator('html')).toHaveClass(/lite/);
  await expect(page.locator('section.caption[data-step="genes"]')).toBeVisible();
  await page.keyboard.press('PageDown');
  await expect.poll(async () => (await state(page))?.id).toBe('lump');
  expect(errors).toEqual([]);
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
  await page.goto('/?stop=genes');
  await expect(page.locator('.fallback-img img')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Interactive 3D isn’t available' })).toBeVisible();
  await expect(page.locator('section.caption[data-step="genes"]')).toBeVisible();
  // the cards that hang in the 3D study are still there
  await page.goto('/?stop=doctor');
  await expect(page.getByRole('article', { name: 'Profile of Max Wilms' })).toBeVisible();
  await expect(page.locator('.fallback-img img')).toHaveAttribute('src', '/fallback/study.webp');
});

for (const vp of [
  { name: 'laptop 1366×768', width: 1366, height: 768 },
  { name: 'board 1920×1080', width: 1920, height: 1080 },
]) {
  test(`fits the screen on a ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/?stop=lump&e2e');
    await waitForStage(page);
    const caption = page.locator('section.caption[data-step="lump"]');
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

  test('readable text, and swiping moves through the scene', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/?e2e&stop=doctor');
    await waitForStage(page);
    // text sized for the back of a classroom
    const title = page.locator('section.caption[data-step="doctor"] .caption__title');
    await expect(title).toBeVisible();
    expect(parseFloat(await title.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(40);
    const body = page.locator('section.caption[data-step="doctor"] .caption__body');
    expect(parseFloat(await body.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(24);
    // no slide furniture on screen
    await expect(page.getByRole('button', { name: /^(Next|Back)$/ })).toHaveCount(0);
    // a finger swipe up zooms on to the next stop and comes to rest there; a tiny swipe falls back
    await expect.poll(async () => Math.abs(((await state(page))?.t ?? 0) - 1)).toBeLessThan(0.01);
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
    // swiping down goes back (past the over-the-shoulder shot, which the camera only flies through)
    await swipe(1300, 400, 420);
    await expect.poll(async () => (await state(page))?.id).toBe('doctor');
    await expect(page.getByRole('button', { name: /Full screen/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('the summary leads on to the list of sources', async ({ page }) => {
    await page.goto('/?stop=end&e2e');
    await waitForStage(page);
    const end = page.locator('section.caption[data-step="end"]');
    // the summary is one drawing: who, cause, sign, the kidney, finding it, treating it, the outcome
    await expect(end.locator('svg.sum')).toContainText('93');
    await expect(end.locator('.sum__kicker')).toHaveCount(6);
    await end.getByRole('button', { name: 'References' }).tap();
    const sources = page.locator('#sources');
    await expect.poll(async () => Math.abs((await sources.boundingBox())?.y ?? 999)).toBeLessThan(4);
    await expect(sources.getByRole('heading', { name: 'References' })).toBeVisible();
    expect(await sources.locator('.endnotes__refs li').count()).toBe(SOURCES.length);
    await expect(sources.locator('.endnotes__terms')).toContainText('Nephroblastoma');
    await expect(sources.locator('.endnotes__credits')).toContainText('BodyParts3D');
    await expect(sources.locator('.endnotes__credits')).toContainText('Wellcome Collection');
    await expect(sources).toContainText('Vardhmansinh Rathod');
    expect(Math.round(await page.evaluate(() => window.scrollY / innerHeight))).toBe(SOURCES_PAGE);
    // stepping back from the top of the list returns to the last stop (the quick check)
    await page.keyboard.press('PageUp');
    await expect.poll(async () => Math.round(await page.evaluate(() => window.scrollY / innerHeight))).toBe(STOPS.length - 1);
  });
});

test('the printable presenter guide has a script for every stop and the quiz answers', async ({ page }) => {
  await page.goto('/?guide');
  await expect(page.getByRole('heading', { name: 'Wilms Tumor', level: 1 })).toBeVisible();
  await expect(page.locator('.guide__stop')).toHaveCount(PAUSES.length);
  await expect(page.locator('.guide__say')).toHaveCount(PAUSES.length);
  await expect(page.locator('.guide__answers li')).toHaveCount(QUESTIONS.length);
  await expect(page.locator('.guide__answers')).toContainText('In a kidney');
});
