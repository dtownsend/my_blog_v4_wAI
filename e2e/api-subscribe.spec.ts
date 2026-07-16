import { test, expect } from '@playwright/test';

const invalidPayloads = [
  { name: 'a missing email', data: {} },
  { name: 'an email with no @', data: { email: 'not-an-email' } },
];

for (const { name, data } of invalidPayloads) {
  test(`POST /api/subscribe rejects ${name} with 400`, async ({ request }) => {
    const response = await request.post('/api/subscribe', { data });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid email address' });
  });
}