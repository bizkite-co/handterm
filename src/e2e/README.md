# End-to-End Testing for Handterm

## Testing Philosophy

This E2E testing approach focuses on describing test scenarios in a human-readable, terse English language that can be easily expanded into executable test code.

### Example Test Description Format

```
Scenario: User logs in and starts a typing game
Given the user is on the home page
When the user has not completed the tutorial
Then the user should be presented with the first phrase
And the user should be shown instructions on typing the phrase
```

### Implementation Strategy

1. Use a custom parser to convert these descriptions into executable test cases
2. Leverage React Testing Library and Vitest for test execution
3. Provide clear, reproducible test scenarios that cover key user flows
