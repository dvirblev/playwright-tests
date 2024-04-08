import { test as baseTest, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export * from '@playwright/test';

export async function acquireAccount(id: number) {
    return {
        username: 'daniel' + (Math.random() + 1).toString(36).substring(2, 8) + '_' + id,
        password: '12345'
    };
}

export const test = baseTest.extend<{}, { workerStorageState: string }>({
    // Use the same storage state for all tests in this worker.
    storageState: ({ workerStorageState }, use) => use(workerStorageState),
    // Authenticate once per worker with a worker-scoped fixture.
    workerStorageState: [async ({ browser }, use) => {
        // Use parallelIndex as a unique identifier for each worker.
        const id = test.info().parallelIndex;
        const fileName = path.resolve(test.info().project.outputDir, `.auth/${id}.json`);

        if (fs.existsSync(fileName)) {
            // Reuse existing authentication state if any.
            await use(fileName);
            return;
        }

        // Important: make sure we authenticate in a clean environment by unsetting storage state.
        const page = await browser.newPage({ storageState: undefined });

        // Acquire a unique account, for example create a new one.
        // Alternatively, you can have a list of precreated accounts for testing.
        // Make sure that accounts are unique, so that multiple team members
        // can run tests at the same time without interference.
        const account = await acquireAccount(id);

        // Perform authentication steps. Replace these actions with your own.
        await page.goto('https://demo.wpeverest.com/user-registration/column-1/');
        await page.getByLabel('Username').fill(account.username);
        process.env['USERNAME'] = account.username;
        await page.getByLabel('User Email').fill(account.username + '@test.mail');
        await page.getByLabel('User Password').fill(account.password);
        await page.getByLabel('Confirm Password').fill(account.password);

        await page.getByRole('button', { name: 'Submit' }).click();
        // Wait until the page receives the cookies.
        //
        // Sometimes login flow sets cookies in the process of several redirects.
        // Wait for the final URL to ensure that the cookies are actually set.
        await page.waitForURL('https://demo.wpeverest.com/user-registration/column-1/');

        // End of authentication steps.

        await page.context().storageState({ path: fileName });
        await page.close();
        await use(fileName);
    }, { scope: 'worker' }],
});
