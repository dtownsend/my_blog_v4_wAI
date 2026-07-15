import { test, expect } from './fixtures';

test('subscribe page shows the newsletter form', async ({ page }) => {
  await page.goto('/subscribe');

  // The page's h1 is unique — no scoping needed.
  await expect(
    page.getByRole('heading', { name: 'Subscribe to My Newsletter' })
  ).toBeVisible();

  // The footer ALSO has a subscribe form, so scope to <main>
  // to point at exactly one email field + one button.
  const main = page.getByRole('main');
  await expect(main.getByPlaceholder('Enter your email')).toBeVisible();
  await expect(main.getByRole('button', { name: 'Subscribe' })).toBeVisible();
});

test('subscribe page has the right title and primary nav', async ({ page }) => {
  await page.goto('/subscribe');

  // Title comes from Next metadata: `%s | Inside DTs Brain`.
  await expect(page).toHaveTitle(/Subscribe \| Inside DTs Brain/);

  // Scope to the site nav landmark, then assert each link by ROLE.
  const nav = page.getByRole('navigation');
  for (const label of ['Blog', 'Art', 'Resume', 'About', 'Subscribe']) {
    await expect(nav.getByRole('link', { name: label })).toBeVisible();
  }
});

test('subscribing with a valid email shows the success message', async ({ page, subscribeForm }) => {
  await page.route('**/api/subscribe', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  await subscribeForm.fillAndSubmit('test@example.com');

  await expect(subscribeForm.message('Thanks for subscribing!')).toBeVisible();
});

const errorCases = [
  { status: 400, error: 'Invalid email address' },
  { status: 409, error: "You're already subscribed." },
  { status: 503, error: 'Newsletter is not configured yet.' },
  { status: 500, error: 'Something went wrong. Please try again.' },
];

for (const { status, error } of errorCases) {
  test(`shows the error message when the API responds ${status}`, async ({ page, subscribeForm }) => {
    await page.route('**/api/subscribe', async (route) => {
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error }) });
    });

    await subscribeForm.fillAndSubmit('test@example.com');

    await expect(subscribeForm.message(error)).toBeVisible();
    await expect(subscribeForm.submitButton).toBeVisible();
  });
}

