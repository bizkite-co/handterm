#!/usr/bin/env node
/**
 * This script uses Playwright to inspect the application running at http://localhost:5173/.
 * It captures a screenshot, the page content, console logs, and executes JavaScript code.
 *
 * Usage:
 * 1. Make sure the application is running: `npm run dev`
 * 2. Run this script: `npm run inspect` (assuming you add a script to package.json)
 *
 * Features:
 * - Navigates to http://localhost:5173/
 * - Captures and saves a screenshot as scripts/inspect/screenshot.png
 * - Captures and saves the page content as scripts/inspect/page.html
 * - Captures and saves the console log as scripts/inspect/console.log
 * - Executes JavaScript code in the browser context and saves the result to scripts/inspect/js_result.txt
 * - Focuses the terminal and types 'ls -la', saving the result to scripts/inspect/interaction_result.txt.
 *   You can modify the typed command in the `inspect` function.
 * - Includes error handling for page navigation failures.
 */
import { chromium, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { rimrafSync } from 'rimraf';

/**
 * Executes JavaScript code in the context of the page and saves the result to a file.
 * @param page The Playwright page object.
 * @param script The JavaScript code to execute.
 * @param fileName The name of the file to save the result to.
 */
async function executeJavaScript(page: Page, script: string, fileName: string) {
  try {
    const result = await page.evaluate(script);
    const resultString = result !== undefined ? JSON.stringify(result, null, 2) : 'No result';
    fs.writeFileSync(fileName, resultString);
  } catch (error) {
    console.error('Error executing JavaScript:', error);
    fs.writeFileSync(fileName, `Error: ${error}`);
  }
}

async function inspect() {
  const inspectDir = 'scripts/inspect';

  // Empty the directory
  rimrafSync(inspectDir);

  // Create the directory
  fs.mkdirSync(inspectDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console output
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    const timestamp = new Date().toISOString();
    consoleLogs.push(`[${timestamp}] ${msg.text()}`);
  });

  try {
    await page.goto('http://localhost:5173/');

    // Take a screenshot
    await page.screenshot({ path: `${inspectDir}/screenshot.png` });

    // Get and save page content
    const pageContent = await page.content();
    fs.writeFileSync(`${inspectDir}/page.html`, pageContent);

    // Execute example JavaScript: Get the document title
    await executeJavaScript(
      page,
      'document.title',
      `${inspectDir}/js_result.txt`
    );

    // Example interaction: Focus the terminal and type 'ls -la'
    try {
      await page.focus('#xtermRef');
      await page.keyboard.type('ls -la');
      await page.keyboard.press('Enter');
      await executeJavaScript(
        page,
        '/* Typed ls -la into the terminal */',
        `${inspectDir}/interaction_result.txt`
      )
    } catch (error) {
      console.warn('Could not interact with the terminal:', error);
      await executeJavaScript(
        page,
        `/* Interaction failed: ${error} */`,
        `${inspectDir}/interaction_result.txt`
      )
    }

  } catch (error) {
    console.error('Error during navigation:', error);
    fs.writeFileSync(`${inspectDir}/error.log`, `Error: ${error}. Make sure the server is running at http://localhost:5173/.`);
    await browser.close();
    return; // Exit if navigation fails
  }

  // Wait for 5 seconds for additional console logs
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  await sleep(5000);

  const consoleLogText = consoleLogs.join('\n');

  // Save console logs
  fs.writeFileSync(`${inspectDir}/console.log`, consoleLogText);

  await browser.close();
  console.log("Inspection complete. Check the 'scripts/inspect' directory for results.");
  console.log("\n--- Browser Console Log ---");
  console.log(consoleLogText);
  console.log("--- End of Browser Console Log ---\n");
}

inspect().catch(err => {
  console.error('Error during inspection:', err);
  process.exit(1);
});