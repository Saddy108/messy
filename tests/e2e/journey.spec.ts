// End-to-end journeys against the production build.
import { test, expect, type Page } from '@playwright/test';

const STAGES = Array.from({ length: 12 }, (_, i) => `stage-${String(i + 1).padStart(2, '0')}`);

/** A save where every stage before the last is already tested out, so any lesson can be opened. */
const unlockEverything = (page: Page) =>
  page.addInitScript((stages: string[]) => {
    const testedOut: Record<string, boolean> = {};
    const lessons: Record<string, unknown> = {};
    stages.forEach((s) => {
      testedOut[s] = true;
      lessons[`${s}-boss`] = { stars: 3, best: 3, at: 1 };
    });
    if (!localStorage.getItem('p2k:v1')) localStorage.setItem('p2k:v1', JSON.stringify({ v: 2, testedOut, lessons }));
  }, STAGES);

const click = (page: Page, square: string) => page.locator(`[data-square="${square}"]`).click();

test('first-time journey: finish lesson 1 and keep the progress after a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Start learning/ }).click();

  await page.getByRole('button', { name: /^Next/ }).click(); // narrate 1
  await page.getByRole('button', { name: /^Next/ }).click(); // narrate 2
  await page.getByRole('button', { name: '64', exact: true }).click(); // quiz
  await page.getByRole('button', { name: /^Next/ }).click();
  await page.getByRole('button', { name: 'False', exact: true }).click(); // true/false
  await page.getByRole('button', { name: /^Finish/ }).click();

  await expect(page.getByText('Lesson complete!')).toBeVisible();

  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('p2k:v1') ?? '{}'));
  expect(saved.lessons['board-1'].stars).toBeGreaterThanOrEqual(1);
  expect(saved.xp).toBeGreaterThan(0);
});

test('castling lesson: the king castles kingside and the lesson says so', async ({ page }) => {
  await unlockEverything(page);
  await page.goto('/#/lesson/castle-1');
  await page.getByRole('button', { name: /^Next/ }).click();
  await click(page, 'e1');
  await click(page, 'g1');
  await expect(page.getByText(/Castled!/)).toBeVisible();
});

test('illegal moves are explained, never just rejected', async ({ page }) => {
  await page.goto('/#/arena/play?level=1&mode=guided');
  await click(page, 'e2');
  await click(page, 'e5'); // a pawn cannot jump three squares
  await expect(page.locator('.coach')).toContainText(/pawn|move/i);
  await expect(page.locator('.arena-moves')).toHaveCount(0);
});

test('Arena: play a move against the Level 1 bot and get a reply', async ({ page }) => {
  await page.goto('/#/arena');
  await page.getByRole('button', { name: 'Play!' }).click();
  await click(page, 'e2');
  await click(page, 'e4');
  await expect(page.locator('.arena-moves')).toContainText('e4');
  await expect(page.locator('.arena-moves')).toContainText(/1\. e4 \S+/, { timeout: 15000 }); // the bot answered
});

test('Arena: resigning ends the game and opens the review', async ({ page }) => {
  await page.goto('/#/arena/play?level=1&mode=normal');
  await click(page, 'e2');
  await click(page, 'e4');
  await expect(page.locator('.arena-moves')).toContainText(/1\. e4 \S+/, { timeout: 15000 });
  await page.getByRole('button', { name: /Resign/ }).click();
  await page.getByRole('button', { name: /Review my game/ }).click();
  await expect(page.getByRole('heading', { name: 'Game review' })).toBeVisible();
  await expect(page.locator('.review-row').first()).toBeVisible({ timeout: 20000 });
});

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(async () => page.evaluate(async () => (await (await caches.open('p2k-v1')).keys()).length), { timeout: 30000 })
    .toBeGreaterThan(10);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('link', { name: /Start learning|Continue/ })).toBeVisible();
  await page.goto('/#/arena/minigames');
  await expect(page.getByRole('heading', { name: 'Mini-games' })).toBeVisible();
});
