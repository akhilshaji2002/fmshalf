import { test, expect } from '@playwright/test';
import { ensureUser, loginUI, Role } from './auth';

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

const roleNavChecks: Record<Role, string[]> = {
  member: ['Dashboard', 'Community Chat', 'AI Progress', 'Food Vision', 'My Plan', 'Workouts', 'My Sessions', 'Coaches'],
  trainer: ['Dashboard', 'Community Chat', 'AI Progress', 'Food Vision', 'Trainer Studio', 'Workouts', 'Client Sessions', 'Members', 'Security'],
  admin: ['Dashboard', 'Community Chat', 'AI Progress', 'Food Vision', 'Trainer Studio', 'Workouts', 'Client Sessions', 'Members', 'Security', 'Inventory Mgmt', 'User Management'],
  gymOwner: ['Gym Management', 'Community Chat', 'Settings']
};

const roleRouteSmokes: Record<Role, string[]> = {
  member: ['/', '/chat', '/ai-progress', '/food-vision', '/training', '/kinetix', '/sessions', '/coaches'],
  trainer: ['/', '/chat', '/training', '/kinetix', '/members', '/security', '/sessions', '/coaches'],
  admin: ['/', '/chat', '/training', '/kinetix', '/members', '/security', '/inventory', '/admin/users', '/admin/testimonials'],
  gymOwner: ['/gym-owner', '/chat', '/settings']
};

for (const role of ['member', 'trainer', 'admin', 'gymOwner'] as Role[]) {
  test(`role smoke: ${role}`, async ({ page }) => {
    const user = await ensureUser(role);
    await loginUI(page, user);
    await openModule(page, role === 'gymOwner' ? '/gym-owner' : '/');

    // Sidebar visibility checks
    for (const navText of roleNavChecks[role]) {
      await expect(page.getByText(navText, { exact: true }).first()).toBeVisible();
    }

    // Route/module smoke checks
    for (const route of roleRouteSmokes[role]) {
      await openModule(page, route);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toContainText('Rendered more hooks than during the previous render');
      await expect(page.locator('body')).not.toContainText('SYSTEM RECOVERY');
    }
  });
}

