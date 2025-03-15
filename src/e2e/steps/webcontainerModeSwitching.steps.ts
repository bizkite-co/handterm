import { Given, When, Then } from '@cucumber/cucumber';
import { expect, type Page } from '@playwright/test';

Given('I am on the Handterm page', async function () {
  await (this.page as Page).goto('/'); // Assuming '/' is the Handterm page
});

When('I enter the command {string}', async function (command: string) {
  await (this.page as Page).locator('.xterm-helper-textarea').fill(command);
  await (this.page as Page).keyboard.press('Enter');
});

Then('the URL should contain {string}', async function (expectedUrlPart: string) {
  await (this.page as Page).waitForURL((url: URL) => url.href.includes(expectedUrlPart));
  expect((this.page as Page).url()).toContain(expectedUrlPart);
});

Then('the URL should not contain {string}', async function(unexpectedUrlPart: string) {
    await (this.page as Page).waitForTimeout(500); // Give it some time for the URL to potentially change
    expect((this.page as Page).url()).not.toContain(unexpectedUrlPart);
});

Then('the WebContainer should be initialized', async function () {
  await expect((this.page as Page).locator('body')).toHaveClass(/webcontainer-active/);
});

Then('the WebContainer should be torn down', async function () {
  await expect((this.page as Page).locator('body')).not.toHaveClass(/webcontainer-active/);
});

Then('I should see the output of the {string} command', async function (command: string) {
    const output = await (this.page as Page).locator('.xterm-rows').innerText(); // Placeholder, might need a more robust selector
    expect(output).toContain('PLACEHOLDER'); //Update after implementing command output
});