---
date: 2025-01-06
title: Tutorial Test Improvements
---

# Task
Improve tutorial e2e test reliability and organization, following up on issues identified in [2024-12-13-tutorial-test-investigation.md](2024-12-13-tutorial-test-investigation.md).

# Previous Investigation
The previous investigation identified that tests were hanging at waitForTutorialMode() while manual testing worked correctly. This suggested potential timing issues with tutorial initialization and signal synchronization.

# Problem Understanding
1. Tests were hanging at waitForTutorialMode()
2. Test structure made it difficult to identify which phase was failing
3. Type safety issues in tutorial verification
4. Code duplication in tutorial completion checks

# Implementation

## Enhanced Tutorial Mode Verification
1. Added explicit wait for signals before setting activity:
```typescript
await page.waitForFunction(() => {
  return typeof window.setActivity === 'function' &&
         typeof window.setNextTutorial === 'function' &&
         typeof window.ActivityType !== 'undefined';
}, { timeout: TEST_CONFIG.timeout.medium });
```

2. Added type-safe tutorial completion helper:
```typescript
async function isTutorialCompleted(page: Page, tutorialKey: string): Promise<boolean> {
  try {
    return await page.evaluate((key: string) => {
      const completedTutorials = localStorage.getItem('completed-tutorials');
      if (completedTutorials === null) return false;
      try {
        const tutorials = JSON.parse(completedTutorials) as string[];
        return Array.isArray(tutorials) && tutorials.includes(key);
      } catch {
        console.log('[Tutorial Parse Error] Invalid JSON in completed-tutorials');
        return false;
      }
    }, tutorialKey);
  } catch (error) {
    console.log('[Tutorial Check Error]', error);
    return false;
  }
}
```

## Improved Test Organization
1. Broke down large test into phase-specific tests:
   - Initial tutorial setup
   - fdsa tutorial completion
   - jkl; tutorial completion
   - Game mode transition
   - Game completion and return

2. Added nested describe blocks for better test grouping:
```typescript
test.describe('Tutorial Mode', () => {
  test('should start in tutorial mode with clean state', ...);

  test.describe('tutorial progression', () => {
    test('should start with initial tutorial', ...);
    test('should complete fdsa tutorial', ...);
    test('should complete jkl; tutorial', ...);
    test('should transition to game mode', ...);
    test('should complete game phrase and return to tutorial', ...);
  });
});
```

## Enhanced Debugging
1. Added console log monitoring for browser events
2. Added error logging for tutorial state verification
3. Added page content logging on failures

# Benefits
1. Easier to identify which phase fails
2. Better type safety
3. More maintainable test structure
4. Improved error reporting
5. Consistent verification logic

# Verification
These improvements address the original investigation's findings by:
1. Adding explicit signal verification before setting activity
2. Improving tutorial state verification with better error handling
3. Breaking down tests to identify exactly where initialization might fail
4. Adding comprehensive logging throughout the tutorial progression

# Next Steps
1. Monitor test runs to verify improvements
2. Consider adding similar organization to other e2e tests
3. Consider extracting common test patterns into shared utilities
