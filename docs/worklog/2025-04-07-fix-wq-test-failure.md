---
date: 2025-04-07
title: Fix Failing :wq E2E Test (EditorPage.spec.ts)
issue: 91
---

## Task

Resolve the failing end-to-end test `EditorPage › handles :wq command` in `src/e2e/page-objects/EditorPage.spec.ts`.

## Problem Understanding

The test fails with the error `Error: Terminal element (#xtermRef) not found`. This occurs after the test simulates the `:wq` command in the Monaco editor, which should save the content, close the editor, and return the user to the terminal view (`normal` activity).

The failure happens when the test attempts to verify the terminal prompt is visible again (`TerminalPage.waitForPrompt` -> `TerminalPage.waitForTerminalContainer`). The inability to find the `#xtermRef` element indicates that the terminal component is not being rendered or mounted correctly/quickly enough in the DOM during the transition from the `edit` activity back to the `normal` activity.

## Analysis (Initial)

- **Test Flow:** The test correctly simulates editing, executing `:wq`, and confirms localStorage cleanup. The failure point is specifically when verifying the terminal's reappearance.
- **Component Involved:** The `HandTermWrapper.tsx` component is responsible for conditionally rendering either the Monaco editor or the Xterm terminal based on the current `activitySignal`.
- **Hypothesis:** The issue likely lies within `HandTermWrapper.tsx`. The logic handling the re-rendering and initialization of the terminal when the `activitySignal` changes from `edit` back to `normal` might have a race condition, a faulty conditional check, or an incorrect effect dependency array, preventing the `#xtermRef` element from being present when the test checks for it. The previous fixes mentioned in `plan.md` might have addressed the `:q!` case but not fully covered the `:wq` transition.

## Analysis (After Reviewing HandTermWrapper.tsx)

- **Conditional Rendering:** `HandTermWrapper.tsx` correctly renders the terminal container (`#prompt-and-terminal` containing `#xtermRef`) when `activitySignal.value` is `normal` (i.e., not `EDIT` or `TREE`).
- **Terminal Initialization:** A `useEffect` hook correctly handles terminal initialization (fitting, focusing) when the activity becomes `normal`, using `requestAnimationFrame` for scheduling.
- **Activity Transition:** Logs confirm the activity correctly changes from `edit` to `normal` after `:wq`.
- **Refined Hypothesis:** The application code in `HandTermWrapper.tsx` appears logically sound for this transition. The failure is most likely a **timing issue in the test**. Playwright executes its check (`page.$('#xtermRef')`) immediately after the activity signal changes, but *before* React finishes re-rendering the component and updating the DOM to include the `#xtermRef` element. The test isn't waiting for the element to appear.

## Plan (Revised)

1.  **Modify Test Code:** The primary solution is to make the test more robust by waiting for the element.
    *   Locate the `waitForTerminalContainer` method in `src/e2e/page-objects/TerminalPage.ts`.
    *   Replace the immediate check `const xtermRef = await this.page.$('#xtermRef'); if (!xtermRef) { throw ... }` with a Playwright `locator` and a waiting mechanism. For example:
        ```typescript
        // Example using locator().waitFor()
        const terminalLocator = this.page.locator('#xtermRef');
        await terminalLocator.waitFor({ state: 'attached', timeout: 5000 }); // Wait for element to be attached to DOM

        // Or using expect().toBeVisible()
        await expect(this.page.locator('#xtermRef')).toBeVisible({ timeout: 5000 });
        ```
2.  **Request Mode Switch:** Switch to `code` mode to implement the proposed test fix.
3.  **Retest:** Run `npx playwright test src/e2e/page-objects/EditorPage.spec.ts -g "handles :wq command"` again to confirm the fix. Run the full suite (`npx playwright test`) to check for regressions.

## Next Steps

Request switch to `code` mode to modify `src/e2e/page-objects/TerminalPage.ts`.