import { test, expect } from '@playwright/test';
import { ensureUser, loginUI } from './auth';

async function openModule(page: any, route: string) {
  for (let i = 0; i < 2; i += 1) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      return;
    } catch (err) {
      if (i === 1) throw err;
      await page.waitForTimeout(1200);
    }
  }
}

test('member can generate plan and view diet chart', async ({ page }) => {
  const user = await ensureUser('member');
  await loginUI(page, user);

  await openModule(page, '/training');
  await expect(page.getByText('My Smart Plan')).toBeVisible();

  // Fill stats and generate
  await page.locator('input[name="weight"]').fill('72');
  await page.locator('input[name="height"]').fill('176');
  await page.locator('input[name="age"]').fill('26');
  await page.locator('select[name="gender"]').selectOption('male');
  await page.locator('select[name="activityLevel"]').selectOption('moderate');
  await page.locator('select[name="goals"]').selectOption('Maintain');
  await page.getByRole('button', { name: /Update My Plan/i }).click();

  await expect(page.locator('body')).toContainText('Suggested Macros', { timeout: 30000 });
  await expect(page.locator('body')).toContainText('Advanced Nutrition Plan');
});

test('workouts modal and flow player works', async ({ page }) => {
  const user = await ensureUser('member');
  await loginUI(page, user);

  await openModule(page, '/kinetix');
  await expect(page.locator('body')).toContainText('Workouts', { timeout: 30000 });

  // Open library modal if visible
  const firstExerciseCard = page.locator('section').filter({ hasText: 'Full Program Exercise Library' }).locator('button').first();
  if (await firstExerciseCard.count()) {
    await firstExerciseCard.click();
    await expect(page.locator('body')).toContainText('2D Visual');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await page.getByRole('button', { name: '✕' }).first().click();
  }

  // Flow mode smoke
  const playFlowBtn = page.getByRole('button', { name: /Play Workout Flow/i });
  if (await playFlowBtn.count()) {
    await playFlowBtn.click();
    await expect(page.locator('body')).toContainText('Phase:', { timeout: 10000 });
  }
});

