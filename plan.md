---
title: Fix Playwright Test Failure - completedTutorialsSignal Exposure
issue: 91
---

## Goal

Investigate and fix the primary Playwright test failure: `Error: Required completedTutorialsSignal was not properly exposed`, which originates from `src/e2e/page-objects/TerminalPage.ts:60` and causes numerous test failures across the suite.

## Problem

Multiple Playwright tests fail because the `completedTutorialsSignal` object, expected to be available in the browser's `window` context during tests, is not being correctly exposed or accessed. This prevents tests from interacting with or verifying tutorial completion state.

## Investigation Plan

1.  **Analyze Error Origin:**
    *   [ ] Examine the code around `src/e2e/page-objects/TerminalPage.ts:60` to understand how `completedTutorialsSignal` is expected to be accessed.
2.  **Review Signal Exposure Logic:**
    *   [ ] Analyze the helper function responsible for exposing signals to the window context (likely `src/e2e/helpers/exposeSignals.ts` or similar).
    *   [ ] Review how this helper is invoked in the Playwright test setup (e.g., within `beforeEach` hooks or using `page.addInitScript`). Pay attention to timing and execution context.
3.  **Examine Signal Definition:**
    *   [ ] Check how `completedTutorialsSignal` is defined and initialized in the main application code (e.g., `src/signals/` directory).
4.  **Targeted Test Execution:**
    *   [ ] Select a single, representative test that fails with this specific error (e.g., `src/e2e/edit-command.spec.ts:23:3`).
    *   [ ] Run this single test repeatedly (`npx playwright test src/e2e/edit-command.spec.ts -g "should navigate to edit activity with default file"`) while debugging the exposure mechanism.
5.  **Consult Documentation (if needed):**
    *   [ ] Review Playwright documentation for `addInitScript`, `exposeFunction`, and execution contexts if the cause is unclear.
6.  **Propose Fix:**
    *   [ ] Based on the findings, determine the cause (e.g., timing issue, incorrect context, problem with the signal object itself).
    *   [ ] Formulate a specific code change to fix the signal exposure.

## Implementation & Verification

1.  **Implement Fix:** Apply the proposed code changes.
2.  **Verify Fix:**
    *   [ ] Re-run the single targeted test to confirm it passes.
    *   [ ] Re-run a broader set of tests previously failing with this error (e.g., all tests in `src/e2e/edit-command.spec.ts`) to ensure the fix is robust.
    *   [ ] Consider running the full suite (`npx playwright test`) if time permits, or defer that to the main tracking issue (#91).

## Next Steps (Post-Fix)

*   Commit the fix, referencing this subtask and the main issue (#91).
*   Report completion back to the Architect mode chat.
*   Proceed to the next failing test pattern identified in issue #91.
