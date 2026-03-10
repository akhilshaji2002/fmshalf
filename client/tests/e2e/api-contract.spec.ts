import { test, expect, request } from '@playwright/test';
import { ensureUser } from './auth';

const API = 'http://localhost:5000/api';

test('auth profile requires token and returns user profile', async () => {
  const api = await request.newContext();
  const member = await ensureUser('member');

  const unauthorized = await api.get(`${API}/auth/profile`);
  expect(unauthorized.status()).toBe(401);

  const profile = await api.get(`${API}/auth/profile`, {
    headers: { Authorization: `Bearer ${member.token}` }
  });
  expect(profile.ok()).toBeTruthy();
  const json = await profile.json();
  expect(json.email).toBe(member.email);
  await api.dispose();
});

test('role-based access is enforced for admin inventory routes', async () => {
  const api = await request.newContext();
  const member = await ensureUser('member');
  const admin = await ensureUser('admin');

  const asMember = await api.post(`${API}/inventory`, {
    headers: {
      Authorization: `Bearer ${member.token}`,
      'Content-Type': 'application/json'
    },
    data: { name: 'QA Product', price: 100, stock: 5, category: 'supplement' }
  });
  expect(asMember.status()).toBe(401);

  const asAdmin = await api.post(`${API}/inventory`, {
    headers: {
      Authorization: `Bearer ${admin.token}`,
      'Content-Type': 'application/json'
    },
    data: { name: `QA Product ${Date.now()}`, price: 100, stock: 5, category: 'supplement' }
  });
  expect(asAdmin.ok()).toBeTruthy();
  await api.dispose();
});

test('member can fetch chat contacts and unread state', async () => {
  const api = await request.newContext();
  const member = await ensureUser('member');
  const contacts = await api.get(`${API}/chat/contacts`, {
    headers: { Authorization: `Bearer ${member.token}` }
  });
  expect(contacts.ok()).toBeTruthy();
  const list = await contacts.json();
  expect(Array.isArray(list)).toBeTruthy();

  const unread = await api.get(`${API}/chat/unread`, {
    headers: { Authorization: `Bearer ${member.token}` }
  });
  expect(unread.ok()).toBeTruthy();
  await api.dispose();
});

test('member plan generation and retrieval works', async () => {
  const api = await request.newContext();
  const member = await ensureUser('member');

  const calc = await api.post(`${API}/ai/calculate`, {
    headers: {
      Authorization: `Bearer ${member.token}`,
      'Content-Type': 'application/json'
    },
    data: {
      userId: member._id,
      weight: 72,
      height: 176,
      age: 27,
      gender: 'male',
      activityLevel: 'moderate',
      goals: 'Maintain',
      dietType: 'balanced',
      foodAllergies: []
    }
  });
  expect(calc.ok()).toBeTruthy();

  const myPlan = await api.get(`${API}/ai/my-plan`, {
    headers: { Authorization: `Bearer ${member.token}` }
  });
  expect(myPlan.ok()).toBeTruthy();
  const plan = await myPlan.json();
  expect(plan?.dietPlan).toBeTruthy();
  await api.dispose();
});

test('kinetix endpoints are stable for authorized user', async () => {
  const api = await request.newContext();
  const member = await ensureUser('member');

  const planRes = await api.get(`${API}/kinetix/plan?tier=Tier 1`, {
    headers: { Authorization: `Bearer ${member.token}` }
  });
  // Accept not-found in incomplete environments, but never server crash.
  expect([200, 404]).toContain(planRes.status());

  if (planRes.status() === 200) {
    const plan = await planRes.json();
    expect(plan?._id).toBeTruthy();
    const firstDay = plan?.days?.find((d: any) => !d.isRestDay && (d.blocks || []).length);
    if (firstDay?.blocks?.length) {
      const firstExercise = firstDay.blocks[0]?.exercise?._id || firstDay.blocks[0]?.exercise;
      const logRes = await api.post(`${API}/kinetix/log`, {
        headers: {
          Authorization: `Bearer ${member.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          planId: plan._id,
          sessionName: firstDay.dayName || 'QA Session',
          exercises: [{
            exercise: firstExercise,
            sets: [{ setNumber: 1, reps: 10, weight: 20, rpe: 8 }]
          }]
        }
      });
      expect(logRes.ok()).toBeTruthy();
    }
  }
  await api.dispose();
});

test.skip('ai progress provider stability (external dependency)', async () => {
  // This route depends on external image provider uptime and is validated manually.
});

