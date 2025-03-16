# Plan to Fix Failing Tests in `src/__tests__/commands/editCommand.test.ts`

## Goal

Fix the failing tests in `src/__tests__/commands/editCommand.test.ts`.

## Problem

The tests in `src/__tests__/commands/editCommand.test.ts` are failing because they are asserting on the wrong function. The `editCommand` calls `context.updateLocation` to change the activity, but the tests are asserting on a mocked `window.setActivity` function, which is never called by the command.

## Approach

1.  **Update Assertions:** Modify the tests in `src/__tests__/commands/editCommand.test.ts` to assert on `mockContext.updateLocation` instead of `mockSetActivity`.

## Steps

1.  Open `src/__tests__/commands/editCommand.test.ts`.
2.  Replace `expect(mockSetActivity).toHaveBeenCalledWith(ActivityType.EDIT);` with `expect(mockContext.updateLocation).toHaveBeenCalledWith({ activityKey: ActivityType.EDIT, contentKey: '_index.md', groupKey: null });` in the "should handle edit command with default filename" test.
3.  Replace `expect(mockSetActivity).toHaveBeenCalledWith(ActivityType.EDIT);` with `expect(mockContext.updateLocation).toHaveBeenCalledWith({ activityKey: ActivityType.EDIT, contentKey: 'test.md', groupKey: null });` in the "should handle edit command with specific filename" test.
4.  Remove the lines related to mocking and setting `window.setActivity` as they are not needed.
5.  Run the tests to verify the fix.

## GitHub Issue and Subtask

*   **Parent Issue:** #79 (Fix Failing Vitest Tests)
*   **Subtask:** Fix failing tests in `src/__tests__/commands/editCommand.test.ts`
