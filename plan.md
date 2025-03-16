# Plan to Fix Failing Tests in `src/components/HandTermWrapper.test.tsx`

## Goal

Fix the failing tests in `src/components/HandTermWrapper.test.tsx`.

## Problem

The tests are failing with the error `Error: Unable to find an element by: [data-testid="xtermRef"]`. This is because the mock `xtermRef` provided by the mocked `useTerminal` hook doesn't include the `data-testid="xtermRef"` attribute, which is used by `TerminalTestUtils.waitForPrompt()` to find the terminal element.

## Approach

1.  **Fix Mock `xtermRef`:** Modify the mock `xtermRef` in the `useTerminal` mock within `src/components/HandTermWrapper.test.tsx` to include the `data-testid="xtermRef"` attribute.

## Steps

1.  Open `src/components/HandTermWrapper.test.tsx`.
2.  Modify the `useTerminal` mock (lines 67-73) to include the `data-testid` attribute:
    ```typescript
    vi.mock('../hooks/useTerminal', () => ({
      useTerminal: () => ({
        xtermRef: { current: Object.assign(document.createElement('div'), { dataset: { testid: 'xtermRef' } }) },
        writeToTerminal: vi.fn(),
        resetPrompt: vi.fn(),
      })
    }));
    ```
3.  Run the tests to verify the fix.

## GitHub Issue and Subtask

*   **Parent Issue:** #79 (Fix Failing Vitest Tests)
*   **Subtask:** Fix failing tests in `HandTermWrapper.test.tsx`
