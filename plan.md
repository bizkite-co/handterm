# Plan to Fix Issue #59

**Issue:** #59 - HandTermWrapper > should maintain single prompt after activity changes

**Problem:** The prompt is being duplicated (`> > `) after activity changes or edits.

**Cause (Hypothesis):** Some interaction between `HandTermWrapper`, `useTerminal`, and potentially React's rendering behavior is causing the prompt to be written twice. The logic in `useTerminal`'s `resetPrompt` and `getCurrentCommand` functions might be flawed, incorrectly determining whether to write the prompt.

**Goal:** Ensure the prompt is always displayed as `'> '` when appropriate (i.e., not in `EDIT` mode) and never duplicated.

**Steps:**

1.  **Investigate `useTerminal`:**
    *   Examine the `resetPrompt` and `getCurrentCommand` functions in `useTerminal.ts` closely.
    *   Analyze the logic for determining whether to write the prompt.
    *   Identify potential flaws that could cause the prompt to be written twice.

2.  **Investigate `HandTermWrapper`:**
    *   Review how `HandTermWrapper` interacts with `useTerminal`, particularly how it calls `resetPrompt`.
    *   Identify any potential issues in the interaction that could lead to prompt duplication.

3.  **Examine and Update Test:**
    *   The current test (`should maintain single prompt after activity changes`) is insufficient.
    *   Update the test to check for the *correct* prompt string (`> `) and not just the *number* of prompts.
    *   Ensure the test covers different activity types and edit mode.

4.  **Implement Fix:**
    *   Based on the investigation, modify the code in `useTerminal` and/or `HandTermWrapper` to prevent prompt duplication.
    *   Ensure the prompt is always displayed correctly.

5.  **Test:**
    *   Run the updated test to verify the fix.
    *   Perform manual testing to ensure the prompt behaves correctly in different scenarios.