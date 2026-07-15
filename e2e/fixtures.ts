import { test as base, expect, type Locator } from '@playwright/test';

type SubscribeForm = {
  emailInput: Locator;
  submitButton: Locator;
  fillAndSubmit: (email: string) => Promise<void>;
  message: (text: string) => Locator;
};

export const test = base.extend<{ subscribeForm: SubscribeForm }>({
  subscribeForm: async ({ page }, use) => {
    await page.goto('/subscribe');                     // setup
    const main = page.getByRole('main');
    const emailInput = main.getByPlaceholder('Enter your email');
    const submitButton = main.getByRole('button', { name: 'Subscribe' });

    await use({
      emailInput,
      submitButton,
      fillAndSubmit: async (email) => {
        await emailInput.fill(email);
        await submitButton.click();
      },
      message: (text) => main.getByText(text),
    });
  },
});

export { expect };