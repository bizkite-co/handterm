---
title: fix #87 Failing Test in awsApiClient.test.ts
---

## Goal

Fix the failing test in `src/__tests__/utils/awsApiClient.test.ts`.

## Problem

The test fails with the error "mockRequest is not defined". This is because the `vi.mock('axios', ...)` call, which defines the mock for the `axios` library, is placed inside the `beforeEach` block. Vitest hoists `vi.mock` calls to the top of the file, so `mockRequest` is not defined at the time the mock is being created.

## Approach

1.  **Move Mock:** Move the `vi.mock('axios', ...)` call to the top of the file, outside of the `beforeEach` block.

## Steps

1.  Open `src/__tests__/utils/awsApiClient.test.ts`.
2.  Move the code block from lines 17-28 to before the `describe` block (before line 5).
3.  Run the tests to verify the fix.

## GitHub Issue and Subtask

*   **Parent Issue:** #79 (Fix Failing Vitest Tests)
*   **Subtask:** Fix failing test in `awsApiClient.test.ts`
