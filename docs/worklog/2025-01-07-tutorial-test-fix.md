---
date: 2025-01-07
title: Fix Tutorial Test Sequence
---

## Task
Fix the sequence of tests in `src/e2e/tests/tutorial.spec.ts` where the second test fails because the first test's prompt is still displayed.

## Problem Understanding
- The first tutorial test requires typing `\r`
- The second test requires typing `fdsa\r`
- Currently, when the second test runs, the prompt from the first test is still displayed
- This causes the second test to fail since it expects `fdsa\r` but gets stuck on the first test's prompt

## Proposed Solution
Load `'\r'` into the `completedTutorials` array before opening the browser for the second test.

## Next Steps
1. Examine the current implementation in tutorial.spec.ts
2. Identify where the completedTutorials array is managed
3. Modify the test setup to properly initialize the tutorial state
4. Verify the tests pass with the changes
