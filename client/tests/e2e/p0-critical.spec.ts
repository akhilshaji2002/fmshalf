import { test, expect, request } from '@playwright/test';
import { ensureUser } from './auth';

const API = 'http://localhost:5000/api';

test('P0 booking lifecycle: member booking visible to trainer and member', async () => {
  const api = await request.newContext();
  const member = await ensureUser('member');
  const trainer = await ensureUser('trainer');

  const bookingDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const create = await api.post(`${API}/bookings`, {
    headers: {
      Authorization: `Bearer ${member.token}`,
      'Content-Type': 'application/json'
    },
    data: {
      coachId: trainer._id,
      coachName: trainer.name,
      date: bookingDate,
      trainingType: 'online'
    }
  });
  expect(create.ok()).toBeTruthy();

  const memberBookings = await api.get(`${API}/bookings`, {
    headers: { Authorization: `Bearer ${member.token}` }
  });
  expect(memberBookings.ok()).toBeTruthy();
  const memberList = await memberBookings.json();
  expect(Array.isArray(memberList)).toBeTruthy();
  expect(memberList.some((b: any) => String(b.coach?._id || b.coach) === String(trainer._id))).toBeTruthy();

  const trainerBookings = await api.get(`${API}/bookings`, {
    headers: { Authorization: `Bearer ${trainer.token}` }
  });
  expect(trainerBookings.ok()).toBeTruthy();
  const trainerList = await trainerBookings.json();
  expect(Array.isArray(trainerList)).toBeTruthy();
  expect(trainerList.some((b: any) => String(b.member?._id || b.member) === String(member._id))).toBeTruthy();

  await api.dispose();
});

test('P0 chat media upload reliability across repeated uploads', async () => {
  const api = await request.newContext();
  const member = await ensureUser('member');
  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AApMBgT4fWQwAAAAASUVORK5CYII=',
    'base64'
  );

  for (let i = 0; i < 3; i += 1) {
    const upload = await api.post(`${API}/chat/upload`, {
      headers: { Authorization: `Bearer ${member.token}` },
      multipart: {
        media: { name: `upload-${i}.png`, mimeType: 'image/png', buffer: tinyPng }
      }
    });
    expect(upload.ok()).toBeTruthy();
    const body = await upload.json();
    expect(body.mediaType).toBe('image');
    expect(String(body.mediaUrl || '').startsWith('/uploads/')).toBeTruthy();
  }

  await api.dispose();
});

