---
date: 2025-02-04
title: Fix Tutorial E2E Tests
---

# Task
Fix failing tutorial progression E2E tests in `src/e2e/tests/tutorial.spec.ts`.

# Understanding
The tutorial progression tests are failing because:

1. Tutorial completion state is not being properly maintained between test steps
2. There's a bug in the test initialization code that prevents proper state setup
3. The localStorage state management for completed tutorials is not working as expected

Key findings from code analysis:

1. Test Setup Issues:
   - Duplicate condition in beforeEach hook causing incorrect initialization
   ```javascript
   testInfo.title === 'should complete \\r tutorial' ? [] :
   testInfo.title === 'should complete \\r tutorial' ? [] : // Duplicated line
   ```

2. State Management:
   - Tutorial completion is tracked in localStorage via 'completed-tutorials'
   - The test setup attempts to initialize state but subsequent updates aren't working
   - No clear mechanism to update completed tutorials after successful completion

3. Test Dependencies:
   - Tests are sequential and depend on previous completions
   - fdsa tutorial fails first, causing cascade of failures
   - Each test expects specific completed tutorials array state

# Plan

1. Fix test initialization:
   - Remove duplicate condition in beforeEach
   - Ensure proper initial state for each test case

2. Add proper state verification:
   - Add logging to track localStorage state changes
   - Verify state updates after each tutorial completion

3. Implement proper tutorial completion tracking:
   - Ensure localStorage is updated after successful tutorial completion
   - Add explicit state checks between steps

# Next Steps

1. Fix the duplicate condition in test initialization
2. Add additional logging for tutorial state transitions
3. Verify localStorage updates are working as expected
4. Add explicit completion checks after each tutorial step

// TODO: Fix duplicate condition in test initialization - see 2025-02-04-fix-tutorial-e2e-tests.md
// TODO: Add tutorial state transition logging - see 2025-02-04-fix-tutorial-e2e-tests.md
// TODO: Implement proper tutorial completion tracking - see 2025-02-04-fix-tutorial-e2e-tests.md
