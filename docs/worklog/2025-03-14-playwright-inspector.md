# Playwright Inspector Plan - 2025-03-14

## Objective

Create a script to allow inspection of the running application at `http://localhost:5173/` using Playwright. This will provide the AI with the ability to see the application's state (screenshot and console output), which it currently cannot do directly.

## Background

The user has requested a way for the AI to inspect the running application. Playwright is already used for e2e testing in this project, so we can leverage that existing setup. The user has confirmed that the application is running on `http://localhost:5173/` and that `npm run dev` should *not* be run.

## Plan

1.  **Examine Existing Playwright Configuration:**
    *   Reviewed `playwright.config.ts`. Key findings:
        *   Headless mode is enabled.
        *   Chromium is used.
        *   `baseURL` is set to `http://localhost:5173/` (confirmed in `src/e2e/config.ts`).
        *   `webServer` is configured to reuse an existing server.
    *   Reviewed `src/e2e/playwright.setup.ts`. Key findings:
        *   Shows how to launch Playwright ( `chromium.launch()` ).
    *   Reviewed `tests/example.spec.ts`. Key findings:
        *  Shows basic structure of Playwright tests and how to use the `page` object.

2.  **Create `inspect.ts`:**
    *   Location: `scripts/` directory.
    *   Language: TypeScript.

3.  **Implement Script Logic:**

    ```typescript
    #!/usr/bin/env node
    import { chromium } from '@playwright/test';

    async function inspect() {
      const browser = await chromium.launch();
      const page = await browser.newPage();

      // Capture console output
      page.on('console', msg => {
        console.log(`PAGE LOG: ${msg.text()}`);
      });

      await page.goto('http://localhost:5173/');

      // Take a screenshot
      const screenshotBuffer = await page.screenshot();
      console.log(`SCREENSHOT (base64): ${screenshotBuffer.toString('base64')}`);

      await browser.close();
    }

    inspect().catch(err => {
      console.error('Error during inspection:', err);
      process.exit(1);
    });

    ```

    *   **Import Playwright:**  `import { chromium } from '@playwright/test';`
    *   **Launch Browser:** `const browser = await chromium.launch();`
    *   **Create Page:** `const page = await browser.newPage();`
    *   **Console Capture:**
        ```typescript
        page.on('console', msg => {
          console.log(`PAGE LOG: ${msg.text()}`);
        });
        ```
    *   **Navigate:** `await page.goto('http://localhost:5173/');`
    *   **Screenshot:**
        ```typescript
        const screenshotBuffer = await page.screenshot();
        console.log(\`SCREENSHOT (base64): \${screenshotBuffer.toString('base64')}\`);
        ```
        *   The screenshot is captured as a buffer and then converted to a base64 string for output. This allows the AI to "see" the image data.
    * **Close Browser:** `await browser.close();`
    * **Error Handling:** The `inspect()` function is called with a `.catch()` block to handle any errors and exit the script with a non-zero exit code.

4.  **Test the Script:**
    *   Run the script: `npx ts-node scripts/inspect.ts` (or similar command, depending on the TypeScript setup).
    *   Verify that the script connects to the application, captures a screenshot, and captures console output.

5.  **Consider MCP Integration (Later):**
    *   This could be a future enhancement, but it's not necessary for the initial implementation.

## Next Steps
1. Switch to Code mode.
2. Create the `inspect.ts` script.
3. Test the script.