import { test, expect } from '@playwright/test';

test('real route maps a beehiiv success to 200', async ({ request }) => {
  const res = await request.post('/api/subscribe', { data: { email: 'new@example.com' } });
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ success: true });
});

test('real route maps a beehiiv 409 to already-subscribed', async ({ request }) => {
  const res = await request.post('/api/subscribe', { data: { email: 'dupe@example.com' } });
  expect(res.status()).toBe(409);
  expect(await res.json()).toEqual({ error: "You're already subscribed." });
});

test('real route maps a beehiiv failure to 500', async ({ request }) => {
  const res = await request.post('/api/subscribe', { data: { email: 'boom@example.com' } });
  expect(res.status()).toBe(500);
  expect(await res.json()).toEqual({ error: 'Something went wrong. Please try again.' });
});