import { expect, test, type Page } from '@playwright/test';

async function chooseGame(page: Page, size: number, mode: 'Cartoons' | 'Photos') {
  await page.goto('./');
  await page.getByRole('button', { name: `${size} cards` }).click();
  await page.getByRole('button', { name: mode }).click();
  await expect(page.locator('.board .card')).toHaveCount(size);
}

async function cardPairs(page: Page) {
  const cards = await page.$$eval('.board .card', (els) =>
    els.map((e) => ({ id: e.dataset.id!, object: e.dataset.object! })),
  );
  const byObject = new Map<string, string[]>();
  for (const c of cards) byObject.set(c.object, [...(byObject.get(c.object) ?? []), c.id]);
  return [...byObject.values()];
}

test('a mismatch turns back over and a full game reaches the win screen', async ({ page }) => {
  await chooseGame(page, 4, 'Cartoons');
  const pairs = await cardPairs(page);

  await page.click(`[data-id="${pairs[0][0]}"]`);
  await page.click(`[data-id="${pairs[1][0]}"]`);
  await expect(page.locator('.board .card.up')).toHaveCount(2);
  await expect(page.locator('.board .card.up')).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('.board.busy')).toHaveCount(0);

  for (const [a, b] of pairs) {
    await page.click(`[data-id="${a}"]`);
    await page.click(`[data-id="${b}"]`);
    await expect(page.locator(`[data-id="${a}"]`)).toHaveClass(/matched/, { timeout: 5000 });
    await expect(page.locator('.board.busy')).toHaveCount(0, { timeout: 10_000 });
  }
  await expect(page.locator('.tray .stack')).toHaveCount(2);
  await expect(page.locator('.win .dancer')).toHaveCount(2, { timeout: 5000 });
  await page.getByRole('button', { name: 'Play again' }).click({ timeout: 8000 });
  await expect(page.locator('.board .card.down')).toHaveCount(4);
});

test('a game in progress can be resumed after reload', async ({ page }) => {
  await chooseGame(page, 8, 'Cartoons');
  const [a, b] = (await cardPairs(page))[0];
  await page.click(`[data-id="${a}"]`);
  await page.click(`[data-id="${b}"]`);
  await expect(page.locator(`[data-id="${a}"]`)).toHaveClass(/matched/, { timeout: 5000 });
  await page.reload();
  await page.getByRole('button', { name: 'Carry on playing' }).click();
  await expect(page.locator('.tray .stack')).toHaveCount(1);
  await expect(page.locator('.board .card.down')).toHaveCount(6);
});

test('photo pairs match on the object, not the picture', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: '12 cards' }).click();
  const photos = page.getByRole('button', { name: 'Photos' });
  test.skip((await photos.getAttribute('aria-disabled')) !== null, 'photo deck not bundled');
  await photos.click();
  for (const [a, b] of await cardPairs(page)) {
    const srcA = await page.locator(`[data-id="${a}"] img`).getAttribute('src');
    const srcB = await page.locator(`[data-id="${b}"] img`).getAttribute('src');
    expect(srcA).not.toBe(srcB);
  }
});
