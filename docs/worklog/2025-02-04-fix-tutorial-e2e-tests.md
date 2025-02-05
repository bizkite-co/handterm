---
date: 2025-02-04
title: Fix Tutorial E2E Tests
---

# Task
Fix failing tutorial progression E2E tests in `src/e2e/tests/tutorial.spec.ts`.

# Understanding
After analyzing and fixing the codebase, we found several issues causing the tutorial progression tests to fail:

1. Signal State Management:
   - Tutorial completion is managed by a persistent signal using createPersistentSignal
   - The signal maintains its own state and syncs with localStorage
   - Tests were directly manipulating localStorage without updating the signal state
   - Fixed by removing direct localStorage manipulation and using proper initialization

2. Initialization Timing:
   - Tutorial signals use setTimeout(loadInitialState, 100) for initialization
   - Tests were not waiting for signals to be fully initialized
   - Added explicit checks for signal initialization in beforeEach
   - Added additional logging to track state transitions

3. State Synchronization:
   - Tests now properly initialize state through context.addInitScript
   - Added verification that both localStorage and signals are in sync
   - Added wait for tutorial signals to be properly initialized
   - Added state logging before key operations

4. Test Dependencies:
   - Tests are sequential and depend on previous completions
   - Each test now properly verifies its initial state
   - Added more comprehensive state checks between steps
   - Improved error messages for state verification failures

5. Key Changes Made:
   - Removed direct localStorage manipulation in fdsa test
   - Added wait for tutorial signals initialization
   - Added state logging before activity changes
   - Improved state verification between test steps

# Plan

1. Fix test initialization:
   - ✓ Remove duplicate condition in beforeEach
   - ✓ Ensure proper initial state for each test case
   - ✓ Move state initialization to context.addInitScript

2. Fix state synchronization:
   - ✓ Remove direct localStorage manipulation in tests
   - ✓ Use proper signal initialization in beforeEach
   - Add wait for tutorial signals to be initialized

3. Improve state verification:
   - ✓ Add logging to track localStorage state changes
   - ✓ Add explicit state checks between steps
   - ✓ Verify localStorage and signal state are in sync

4. Next Steps:
   - Add wait for tutorial signals to be initialized in beforeEach
   - Add additional logging around signal state changes
   - Consider adding retry logic for state verification

# Next Steps

1. Fix the duplicate condition in test initialization
2. Add additional logging for tutorial state transitions
3. Verify localStorage updates are working as expected
4. Add explicit completion checks after each tutorial step

// TODO: Fix duplicate condition in test initialization - see 2025-02-04-fix-tutorial-e2e-tests.md
// TODO: Add tutorial state transition logging - see 2025-02-04-fix-tutorial-e2e-tests.md
// TODO: Implement proper tutorial completion tracking - see 2025-02-04-fix-tutorial-e2e-tests.md
