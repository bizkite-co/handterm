# Plan to Fix Failing Test in `src/hooks/useTerminal.test.ts`

## Goal

Fix the failing test "should maintain single prompt through complete lifecycle" in `src/hooks/useTerminal.test.ts`.

## Problem

The test fails because the prompt is being written twice. The issue lies in the `useTerminal` hook, specifically in the `resetPrompt` and `getCurrentCommand` functions. The `resetPrompt` function unnecessarily checks if the prompt is already present before writing it, and the `getCurrentCommand` function uses an overly complex and error-prone method to retrieve the current command.

## Approach

1.  **Simplify `getCurrentCommand`:** Modify the `getCurrentCommand` function in `src/hooks/useTerminal.ts` to return the value of the `commandLineSignal` directly. This signal already tracks the current command.
2.  **Remove Prompt Check in `resetPrompt`:** Remove the conditional check in the `resetPrompt` function (line 74 in `src/hooks/useTerminal.ts`) that prevents the prompt from being written if it's already present. The prompt should always be written after a reset.
3.  **Update the Test (if needed):** The test's mock `write` function can likely remain as is, but the assertions might need slight adjustments to reflect the expected behavior after these changes.

## Steps

1.  Open `src/hooks/useTerminal.ts`.
2.  Replace the implementation of `getCurrentCommand` with `return commandLine.value;`.
3.  Remove the `if (!currentContent.includes(TERMINAL_CONSTANTS.PROMPT)) { ... }` block from the `resetPrompt` function.
4.  Open `src/hooks/useTerminal.test.ts`.
5.  Review and adjust the assertions in the "should maintain single prompt through complete lifecycle" test as needed.
6.  Run the tests to verify the fix.

## GitHub Issue and Subtask

*   **Parent Issue:** #79 (Fix Failing Vitest Tests)
*   **Subtask:** Fix failing test in `useTerminal.test.ts`
