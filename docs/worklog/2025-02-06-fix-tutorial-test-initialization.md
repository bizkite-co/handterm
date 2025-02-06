# Tutorial Test Initialization Fix

## Current Issues

1. Test Initialization Problems:
   * `ReferenceError: previousAllDefined is not defined` in beforeEach hook
   * Scope issue with state tracking variable
   * Inconsistent signal initialization between setup.ts and tutorial.spec.ts

2. Architectural Concerns:
   * Signal interface mismatch (from analysis.md)
   * Inconsistent type validation
   * Multiple initialization points causing race conditions

## Root Cause Analysis

1. Immediate Error:
   * `previousAllDefined` is declared outside waitForFunction but referenced inside
   * JavaScript scope rules prevent access to the outer variable
   * Current implementation doesn't properly handle state tracking

2. Underlying Issues:
   * Signal initialization split between setup.ts and exposeSignals.ts
   * Type safety issues in tutorial signals
   * Inconsistent error handling

## Implementation Plan

### Phase 1: Fix Immediate Test Failures

1. Update setup.ts signal initialization:
```ts
test.beforeEach(async ({ page }) => {
  await page.addInitScript(`
    try {
      console.log('[Test Setup] Starting signal initialization');

      // Track initialization state
      window._signalInitState = {
        previousAllDefined: false,
        initializationComplete: false
      };

      // Create signals with proper type checking
      function createSignal(initialValue) {
        let value = initialValue;
        const subscribers = new Set();

        return {
          get value() { return value; },
          set value(newValue) {
            value = newValue;
            subscribers.forEach(fn => fn(value));
          },
          subscribe(fn) {
            subscribers.add(fn);
            return () => subscribers.delete(fn);
          }
        };
      }

      // Initialize signals with type checking
      window.completedTutorialsSignal = createSignal(new Set());
      window.tutorialSignal = createSignal(null);
      window.activityStateSignal = createSignal({
        current: 'TUTORIAL',
        previous: null,
        transitionInProgress: false,
        tutorialCompleted: false
      });

      // Initialize functions with proper error handling
      window.setActivity = (activity) => {
        if (typeof activity !== 'string') {
          throw new Error('Invalid activity type');
        }
        console.log('[Test Setup] Setting activity:', activity);
        window.activityStateSignal.value = {
          ...window.activityStateSignal.value,
          current: activity
        };
      };

      window.setNextTutorial = (tutorial) => {
        console.log('[Test Setup] Setting tutorial:', tutorial);
        window.tutorialSignal.value = tutorial;
      };

      window._signalInitState.initializationComplete = true;
      console.log('[Test Setup] Signals initialized successfully');
    } catch (error) {
      console.error('[Test Setup] Error initializing signals:', error);
      window._signalInitState = {
        previousAllDefined: false,
        initializationComplete: false,
        error
      };
    }
  `);
});
```

2. Update tutorial.spec.ts initialization check:
```ts
// Wait for all functions with proper state tracking
await page.waitForFunction(() => {
  const win = window as any;
  const state = {
    setActivity: typeof win.setActivity,
    setNextTutorial: typeof win.setNextTutorial,
    ActivityType: typeof win.ActivityType,
    completedTutorialsSignal: typeof win.completedTutorialsSignal
  };

  const allDefined = Object.values(state).every(v => v !== 'undefined');

  // Use window-scoped state tracking
  if (allDefined !== win._signalInitState.previousAllDefined) {
    console.log('[Test Setup] All functions defined:', allDefined);
    win._signalInitState.previousAllDefined = allDefined;
  }

  return allDefined && win._signalInitState.initializationComplete;
}, { timeout: TIMEOUTS.medium });
```

### Phase 2: Improve Type Safety

1. Create proper type definitions for test environment:
```ts
interface SignalInitState {
  previousAllDefined: boolean;
  initializationComplete: boolean;
  error?: Error;
}

declare global {
  interface Window {
    _signalInitState: SignalInitState;
  }
}
```

2. Add validation utilities:
```ts
function validateSignalState(state: unknown): state is SignalInitState {
  if (typeof state !== 'object' || state === null) return false;
  const s = state as Partial<SignalInitState>;
  return (
    typeof s.previousAllDefined === 'boolean' &&
    typeof s.initializationComplete === 'boolean'
  );
}
```

### Phase 3: Long-term Improvements

1. Signal Factory Implementation:
   * Create proper signal factories in @handterm/types
   * Use consistent initialization patterns
   * Add comprehensive type checking

2. Test Environment Enhancement:
   * Move signal initialization to dedicated test utility
   * Add proper error boundaries
   * Improve state verification

3. Documentation Updates:
   * Document signal initialization process
   * Add troubleshooting guide
   * Update test patterns documentation

## Next Steps

1. Implement Phase 1 changes to fix immediate test failures
2. Add proper type definitions and validation
3. Create unit tests for signal initialization
4. Document the changes and update test patterns

## Notes

* The current fix addresses both the immediate scope issue and underlying architectural concerns
* Moving state tracking to window scope eliminates closure problems
* Added proper type checking and validation improves reliability
* This approach aligns with the broader signal architecture refactor plan

## Related Issues

* Signal interface mismatch (see analysis.md)
* Type safety improvements (see 2025-02-04-refactor-signal-architecture.md)
* Test environment setup (see 2025-02-04-fix-tutorial-e2e-tests.md)