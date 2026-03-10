import { request, expect, Page } from '@playwright/test';

const API = 'http://localhost:5000/api';
const PASSWORD = 'password123';

export type Role = 'member' | 'trainer' | 'admin' | 'gymOwner';

export async function ensureUser(role: Role) {
  let email = `qa_${role}@fms.local`;
  const name = `QA ${role}`;
  const api = await request.newContext();

  // Try login first
  let res = await api.post(`${API}/auth/login`, {
    data: { email, password: PASSWORD }
  });

  if (!res.ok()) {
    // Register if not existing
    let reg = await api.post(`${API}/auth/register`, {
      data: { name, email, password: PASSWORD, role }
    });
    if (!reg.ok()) {
      // fallback unique email if prior test state is inconsistent
      email = `qa_${role}_${Date.now()}@fms.local`;
      reg = await api.post(`${API}/auth/register`, {
        data: { name, email, password: PASSWORD, role }
      });
    }
    expect(reg.ok()).toBeTruthy();

    res = await api.post(`${API}/auth/login`, {
      data: { email, password: PASSWORD }
    });
  }

  expect(res.ok()).toBeTruthy();
  const user = await res.json();
  await api.dispose();
  return user;
}

export async function loginUI(page: Page, user: any) {
  await page.goto('/login');
  await page.locator('input[type="email"]').first().fill(user.email);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForURL(/(discovery|gym-owner)/, { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
}

