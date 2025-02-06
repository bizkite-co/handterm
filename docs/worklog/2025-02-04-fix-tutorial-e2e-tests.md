# Tutorial E2E Test Investigation

## Current Issues

1. Tests are timing out waiting for window functions
2. Signal initialization is inconsistent between app and tests
3. Multiple initialization points causing race conditions

## Root Causes

1. setup.ts only initializes empty stubs for window methods
2. exposeSignals.ts creates real signals but isn't properly integrated into test setup
3. Inconsistent state management between localStorage and signals

## Required Changes

### 1. Fix Test Environment Setup
* [ ] Move signal initialization to setup.ts
* [ ] Remove duplicate initialization in individual tests
* [ ] Ensure exposeSignals runs before any tests

### 2. Align Signal Management
* [ ] Use createPersistentSignal consistently
* [ ] Remove manual localStorage manipulation
* [ ] Ensure signals and localStorage stay in sync

### 3. Improve Test Stability
* [ ] Add proper error handling for signal initialization
* [ ] Add better logging for initialization failures
* [ ] Remove redundant state setup

## Implementation Plan

1. Update setup.ts:
   ```ts
   test.beforeEach(async ({ page }) => {
     // Initialize signals first
     await page.addInitScript(() => {
       const { exposeSignals } = require('../test-utils/exposeSignals');
       exposeSignals();
     });

     // Wait for signals to be ready
     await page.waitForFunction(() => {
       return typeof window.completedTutorialsSignal !== 'undefined';
     });

     // Then initialize test state
     await page.evaluate(() => {
       window.completedTutorialsSignal.value = new Set();
     });
   });
   ```

2. Clean up tutorial.spec.ts:
   - Remove manual localStorage initialization
   - Use signal functions for state management
   - Add proper error handling

3. Update exposeSignals.ts:
   - Ensure consistent signal creation
   - Add better error reporting
   - Fix race conditions with localStorage

## Next Steps

1. Implement setup.ts changes
2. Update tutorial.spec.ts to use new setup
3. Add error handling and logging
4. Verify signal synchronization

## Notes

- The current approach of manually managing localStorage and signals separately is causing race conditions
- We need to ensure signals are initialized before any tests run
- Better error handling will help identify initialization issues
- Moving signal initialization to setup.ts will provide a single source of truth

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
   - [x] Remove duplicate condition in beforeEach
   - [x] Ensure proper initial state for each test case
   - [x] Move state initialization to context.addInitScript

2. Fix state synchronization:
   - [x] Remove direct localStorage manipulation in tests
   - [x] Use proper signal initialization in beforeEach
   - Add wait for tutorial signals to be initialized

3. Improve state verification:
   - [x] Add logging to track localStorage state changes
   - [x] Add explicit state checks between steps
   - [x] Verify localStorage and signal state are in sync

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
