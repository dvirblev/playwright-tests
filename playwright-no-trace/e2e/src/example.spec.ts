import { test, expect } from '../fixture';

test('has title', async ({ page }) => {
  await page.goto('https://demo.wpeverest.com/user-registration/login/');

  await page.getByLabel('Username or Email Address').fill(process.env['USERNAME'] ?? '');
  await page.getByLabel('Password').fill('12345');

  await page.getByRole('button', {name: 'Login'}).click();

  await page.waitForURL('https://demo.wpeverest.com/user-registration/login/');

  expect(await page.locator('.user-registration').innerText()).toContain('You are already logged in.');
});
