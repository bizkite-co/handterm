## Login E2E Testing Implementation

### Objectives
- [ ] Create E2E test scenario for login process
- [ ] Implement test using Vitest and React Testing Library
- [ ] Simulate terminal interactions for login command

### Test Scenario
```
Scenario: User logs in with GitHub credentials
Given the user is on the login screen
When the user enters valid GitHub credentials
Then the user should be authenticated
And the user should be redirected to the game dashboard
```

### Challenges
- Simulating terminal input in a TUI application
- Mocking authentication process
- Handling async login operations
