# Cucumber + Playwright Integration Strategy

## Implementation Status
- [x] Define directory structure for Cucumber features and step definitions
- [x] Create Playwright test configuration for Cucumber scenarios
- [x] Implement sample step definitions using Playwright
- [x] Convert tutorial progression feature to Playwright test
- [x] Document best practices for writing new features
- [x] Document selector strategy and best practices

## Implementation Details

### Directory Structure
```
e2e/
├── features/           # Cucumber .feature files (for behavior documentation)
│   ├── tutorial/
│   ├── activity/
│   └── auth/
├── page-objects/       # Page Object Models
│   └── components/     # Reusable component interactions
└── tests/             # Playwright test implementations
```

### Key Files Created
1. `src/e2e/page-objects/TutorialPage.ts` - Page object pattern implementation
2. `src/e2e/tests/tutorial.spec.ts` - Playwright test implementation

### Implementation Strategy

1. Use Cucumber (.feature files) for:
   - Behavior documentation
   - Stakeholder communication
   - Acceptance criteria definition

2. Use Playwright for:
   - Test automation implementation
   - Reliable UI interaction
   - Cross-browser testing
   - Screenshot and video capture

3. Use Page Object Pattern for:
   - Encapsulation of page interactions
   - Reusable test components
   - Maintainable selectors

### Best Practices

1. Page Object Pattern
   ```typescript
   // Example from TutorialPage.ts
   export class TutorialPage {
     readonly tutorialMode: Locator;

     async typeKey(key: string) {
       await this.page.keyboard.type(key);
     }
   }
   ```
   - Encapsulate selectors
   - Provide high-level methods
   - Keep implementation details hidden

2. Test Structure
   ```typescript
   // Example from tutorial.spec.ts
   test.describe('Tutorial Progression', () => {
     test.beforeEach(async ({ page }) => {
       tutorialPage = new TutorialPage(page);
     });

     test('should progress...', async () => {
       // Given/When/Then structure
     });
   });
   ```
   - Use descriptive test names
   - Follow Given/When/Then pattern
   - Keep tests focused and atomic

3. Selector Strategy

After careful consideration of industry practices, we're adopting a pragmatic approach to element selection that prioritizes existing semantic markup:

1. **Existing IDs**: Use when they serve both functional and testing purposes
   ```typescript
   // Game component already has a meaningful ID
   this.gameMode = page.locator('#terminal-game');
   ```

2. **Semantic Classes**: Use when they represent component structure
   ```typescript
   // TutorialManager uses a semantic class name
   this.tutorialMode = page.locator('.tutorial-component');
   ```

3. **data-testid**: Only add when no semantic selectors are available
   ```typescript
   // Use data-testid as a last resort when no semantic selectors exist
   this.element = page.getByTestId('element-name');
   ```

### Why This Approach?

1. **Reduced Markup**: Avoids adding test-specific attributes when semantic selectors already exist
2. **Maintainability**: Uses IDs and classes that serve both styling and testing purposes
3. **Industry Standard**: Follows React's own testing documentation which suggests using semantic selectors when possible
4. **Semantic Value**: IDs and classes often provide meaningful context about the component's purpose

## Component Selection Priority

1. Semantic HTML elements (button, input, etc.)
2. ARIA roles and labels
3. Existing IDs with functional purpose
4. Semantic class names
5. data-testid (only when above options aren't suitable)

Example:
```typescript
// Preferred: Use semantic selectors
page.getByRole('button', { name: 'Submit' });
page.locator('#terminal-game');
page.locator('.tutorial-component');

// Last resort: Add data-testid
page.getByTestId('custom-element');
```

## Next Steps

1. Component Updates
   - Review existing semantic markup
   - Use meaningful IDs and classes
   - Consider ARIA roles and labels
   - Add data-testid only when necessary

2. Test Coverage
   - Convert remaining Cucumber scenarios
   - Add edge cases
   - Add visual regression tests

3. CI/CD Integration
   - Set up automated testing
   - Configure reporting
   - Add test artifacts

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test src/e2e/tests/tutorial.spec.ts

# Debug mode
npx playwright test --debug

# Generate report
npx playwright show-report
```

## Common Questions

Q: Should I add data-testid attributes to my components?
A: Not necessarily. First, try using existing semantic selectors like IDs, classes, or ARIA roles. Only add data-testid when no semantic selectors are available or when the existing selectors are too tightly coupled to styling or behavior.

Q: Can I use IDs and classes for testing?
A: Yes! Using existing IDs and classes that serve both functional and testing purposes is preferred over adding test-specific attributes. This reduces markup and maintains semantic meaning.

Q: What's the best way to select elements for testing?
A: Follow this priority:
1. Semantic HTML elements and ARIA roles
2. Existing IDs with functional purpose
3. Semantic class names
4. data-testid (as a last resort)

This approach balances maintainability with semantic meaning while avoiding unnecessary test-specific markup.
