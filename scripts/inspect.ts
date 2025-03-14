#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { rimrafSync } from 'rimraf';

async function inspect() {
  const inspectDir = 'scripts/inspect';

  // Empty the directory using rimraf
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

  await page.goto('http://localhost:5173/');

  // Take a screenshot and save as PNG
  await page.screenshot({ path: `${inspectDir}/screenshot.png` });

  // Get and save page content
  const pageContent = await page.content();
  fs.writeFileSync(`${inspectDir}/page.html`, pageContent);

  // Wait for 5 seconds to allow for additional console logs
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  await sleep(5000);

  // Save console logs
  fs.writeFileSync(`${inspectDir}/console.log`, consoleLogs.join('\n'));

  await browser.close();
}

inspect().catch(err => {
  console.error('Error during inspection:', err);
  process.exit(1);
});