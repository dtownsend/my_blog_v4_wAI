import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('subscribe page has no accessibility violations', async ({ page }) => {
  await page.goto('/subscribe');
  const results = await new AxeBuilder({ page }).analyze();

  const readable = results.violations
    .map(v => `- ${v.id} (${v.impact}): ${v.help}`)
    .join('\n');

  // The 2nd arg to expect() is a message shown ON FAILURE.
  expect(results.violations, `Accessibility violations:\n${readable}`).toEqual([]);
});