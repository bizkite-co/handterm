---
date: 2025-01-06
title: Tutorial Test State Management
---

# Task
Fix tutorial test sequence to maintain state between steps, following up on [2025-01-06-tutorial-test-improvements.md](2025-01-06-tutorial-test-improvements.md).

# Problem Understanding
The original implementation had a critical flaw:
- Each test was resetting to initial state due to beforeEach
- This broke the tutorial sequence which requires:
  1. Enter (\r)
  2. fdsa\r
  3. jkl;\r
  4. Game mode transition
  5. Return to tutorial

# Implementation

## Test Structure Changes
1. Moved to serial test execution:
```typescript
test.describe.serial('tutorial progression', () => {
  test.beforeAll(async ({ context, page }) => {
    // Initialization code moved here
  });

  test('should start with initial tutorial', ...);
  test('should complete fdsa tutorial', ...);
  test('should complete jkl; tutorial', ...);
  // etc.
});
```

2. Moved initialization from beforeEach to beforeAll:
- Ensures state persists between tests
- Maintains tutorial progression
- Only initializes once at the start of the sequence

3. Used test.describe.serial():
- Guarantees tests run in order
- Prevents parallel execution
- Maintains tutorial sequence integrity

## Benefits
1. Tests now properly verify the tutorial sequence
2. State persists between steps as expected
3. Clearer representation of actual user flow
4. More reliable test execution
5. Better debugging of sequence issues

# Verification
The changes ensure:
1. Tutorial state progresses naturally
2. Each step builds on previous steps
3. Sequence matches actual user experience:
   - Start with Enter
   - Progress through fdsa
   - Continue to jkl;
   - Transition to game
   - Return to tutorial

# Next Steps
1. Monitor test runs to verify sequence reliability
2. Consider applying similar patterns to other sequential tests
3. Document this pattern for future test development
