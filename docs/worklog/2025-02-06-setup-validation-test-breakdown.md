# Setup Validation Test Investigation

## Current Problem
We have a failing test in `setup-validation.spec.ts` that needs to be broken down into smaller, more focused tests to identify the exact point of failure in the functionality chain.

## Analysis of Components

### 1. Test Structure
The test suite consists of three main sections:
1. Basic Page Loading and Element Presence
   - Page URL validation
   - #handterm-wrapper element presence
2. Window Extensions
   - Verification of window.completedTutorialsSignal
3. LocalStorage Consistency
   - Cross-context localStorage operations

### 2. Type Implementation
From `packages/types/src/window.ts`:
- `completedTutorialsSignal` is defined as `Signal<Set<string>>`
- This is part of the `WindowExtensions` interface
- The signal is used for tracking completed tutorials

### 3. Known Issues (from analysis.md)
1. Signal Interface Mismatch
   - activitySignal implementation doesn't fully match Signal interface
   - Missing proper type guards
   - Brand symbol type incompatibility
2. Tutorial Signals
   - Inconsistent type casting
   - Missing proper type validation

## Test Decomposition Strategy

### 1. Signal Presence Tests
```typescript
// src/e2e/tests/signal-presence.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test.describe('Signal Presence', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_CONFIG.baseUrl);
  });

  test('window object has completedTutorialsSignal property', async () => {
    const hasSignal = await page.evaluate(() => {
      return 'completedTutorialsSignal' in window;
    });
    expect(hasSignal).toBe(true);
  });

  test('completedTutorialsSignal has value property', async () => {
    const hasValue = await page.evaluate(() => {
      return 'value' in window.completedTutorialsSignal;
    });
    expect(hasValue).toBe(true);
  });

  test.afterEach(async () => {
    await page.close();
  });
});
```

### 2. Signal Value Tests
```typescript
// src/e2e/tests/signal-value.spec.ts
test.describe('Signal Value', () => {
  test('completedTutorialsSignal.value is a Set', async () => {
    const isSet = await page.evaluate(() => {
      return window.completedTutorialsSignal.value instanceof Set;
    });
    expect(isSet).toBe(true);
  });

  test('completedTutorialsSignal.value is empty on initialization', async () => {
    const size = await page.evaluate(() => {
      return window.completedTutorialsSignal.value.size;
    });
    expect(size).toBe(0);
  });
});
```

### 3. Signal Methods Tests
```typescript
// src/e2e/tests/signal-methods.spec.ts
test.describe('Signal Methods', () => {
  test('completedTutorialsSignal has subscribe method', async () => {
    const hasSubscribe = await page.evaluate(() => {
      return typeof window.completedTutorialsSignal.subscribe === 'function';
    });
    expect(hasSubscribe).toBe(true);
  });

  test('completedTutorialsSignal has peek method', async () => {
    const hasPeek = await page.evaluate(() => {
      return typeof window.completedTutorialsSignal.peek === 'function';
    });
    expect(hasPeek).toBe(true);
  });
});
```

### 4. Set Operation Tests
```typescript
// src/e2e/tests/set-operations.spec.ts
test.describe('Set Operations', () => {
  test('can add string to completedTutorialsSignal value', async () => {
    await page.evaluate(() => {
      window.completedTutorialsSignal.value.add('test-tutorial');
    });
    const hasValue = await page.evaluate(() => {
      return window.completedTutorialsSignal.value.has('test-tutorial');
    });
    expect(hasValue).toBe(true);
  });

  test('can check string existence in completedTutorialsSignal value', async () => {
    const hasNonexistent = await page.evaluate(() => {
      return window.completedTutorialsSignal.value.has('nonexistent-tutorial');
    });
    expect(hasNonexistent).toBe(false);
  });
});
```

### 5. Cross-Context Tests
```typescript
// src/e2e/tests/context-boundaries.spec.ts
test.describe('Context Boundaries', () => {
  test('can read signal value across context boundary', async () => {
    await page.evaluate(() => {
      window.completedTutorialsSignal.value = new Set(['test-tutorial']);
    });
    const value = await page.evaluate(() => {
      return Array.from(window.completedTutorialsSignal.value);
    });
    expect(value).toEqual(['test-tutorial']);
  });

  test('can modify signal value across context boundary', async () => {
    await page.evaluate(() => {
      window.completedTutorialsSignal.value.add('modified-tutorial');
    });
    const hasValue = await page.evaluate(() => {
      return window.completedTutorialsSignal.value.has('modified-tutorial');
    });
    expect(hasValue).toBe(true);
  });
});
```

## Implementation Plan

1. Create test files in this order:
   - `signal-presence.spec.ts` - Most basic tests
   - `signal-value.spec.ts` - Value type and state tests
   - `signal-methods.spec.ts` - Interface completeness tests
   - `set-operations.spec.ts` - Set functionality tests
   - `context-boundaries.spec.ts` - Cross-context tests

2. Test Execution Strategy:
   - Run tests in order of complexity
   - Each test file focuses on one aspect
   - Tests build on each other's assertions
   - Early tests establish basic assumptions

3. Failure Isolation:
   - Each test verifies one specific aspect
   - Failures immediately identify problem area
   - No test depends on side effects
   - Clear separation of concerns

## Success Criteria
- Each test verifies exactly one thing
- Test failures point to specific issues
- No test requires logging to understand failure
- Clear path from failure to fix

## Next Steps
1. Switch to Code mode to implement the test files
2. Run tests in sequence to identify failure point
3. Document specific failure and propose fix

## Expected Outcomes
- Precise identification of failure point
- Clear understanding of which interface aspect fails
- Specific, actionable fix proposal
- Improved test suite organization