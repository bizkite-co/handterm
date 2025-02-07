# Setup Validation Tests Plan

## Background
Our end-to-end tests for the tutorial functionality are failing. Rather than trying to fix all tests at once, we need to create minimal tests that verify each prerequisite our main tests depend on. This will help us identify exactly where things start breaking down.

## Test Categories

### 1. Basic Page Loading and Element Presence
- Load the page successfully
- Verify #handterm-wrapper element is present
- Verify terminal component is visible
- Expected outcome: These tests will confirm that our basic page structure is correct and accessible

### 2. Window Extensions
- Verify window.completedTutorialsSignal is defined
- Verify window.tutorialSignal is defined
- Verify window.activityStateSignal is defined
- Verify helper functions (setActivity, setNextTutorial) are defined
- Expected outcome: These tests will confirm that our global objects are being properly initialized

### 3. Signal Initialization
- Create a simple signal
- Read its initial value
- Update its value
- Subscribe to changes
- Expected outcome: These tests will verify that our signal implementation works in the Playwright context

### 4. LocalStorage Integration and Consistency
- Read from localStorage in Playwright context
- Write to localStorage in Playwright context
- Verify localStorage persistence between page loads
- **Verify localStorage Instance Consistency:**
  * Write to localStorage from the test context
  * Verify the app can read the same value
  * Write to localStorage from the app context
  * Verify the test can read the same value
  * Use a unique key to ensure we're testing the correct instance
- Expected outcome: These tests will confirm that:
  1. Our localStorage interactions work as expected
  2. The app and tests are using the same localStorage instance
  3. Changes made in one context are visible in the other

## Implementation Strategy
1. Create a new test file `src/e2e/tests/setup-validation.spec.ts`
2. Implement tests in order of dependency (page loading -> window extensions -> signals -> localStorage)
3. Keep each test as minimal as possible
4. Add detailed logging to help diagnose failures
5. Use these tests to identify where our main tests start failing

### LocalStorage Verification Strategy
1. Test Setup:
   ```typescript
   const TEST_KEY = 'playwright-test-key';
   const TEST_VALUE = 'test-value-' + Date.now(); // Unique value
   ```

2. Test Sequence:
   a. Write from test context:
   ```typescript
   await page.evaluate(() => {
     localStorage.setItem('test-key', 'test-value');
   });
   ```

   b. Read from app context:
   ```typescript
   const appRead = await page.evaluate(() => {
     return window.localStorage.getItem('test-key');
   });
   ```

   c. Write from app context:
   ```typescript
   await page.evaluate(() => {
     window.localStorage.setItem('app-key', 'app-value');
   });
   ```

   d. Read from test context:
   ```typescript
   const testRead = await page.evaluate(() => {
     return localStorage.getItem('app-key');
   });
   ```

3. Verification:
   - Compare values to ensure they match
   - Check that values persist across page reloads
   - Verify that clearing localStorage in one context affects both

## Next Steps
1. Switch to Code mode to implement these validation tests
2. Run tests individually to identify the first point of failure
3. Use the results to inform fixes for the main tutorial tests

## Success Criteria
- All validation tests pass
- Each test provides clear feedback on failure
- Test results help identify specific issues in the main tutorial tests