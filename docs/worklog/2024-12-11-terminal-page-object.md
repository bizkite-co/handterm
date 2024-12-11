# Terminal Page Object Implementation

Create a broader Terminal page object class to handle Xterm.js terminal interactions in Playwright tests.

- [x] Review existing TutorialPage.ts implementation
- [x] Create new TerminalPage class
  - [x] Add locator for Xterm.js command line using '#xtermRef'
  - [x] Add locator for Output element using '#output-container'
- [x] Implement basic terminal interaction methods
  - [x] Method to type commands (typeCommand and executeCommand)
  - [x] Method to get terminal output (getOutput and waitForOutput)
  - [x] Added focus() method for explicit terminal focusing
- [x] Add shared terminal constants
  - [x] Created src/constants/terminal.ts for shared PROMPT value
  - [x] Updated useTerminal.ts to use shared constants
  - [x] Added prompt-aware methods to TerminalPage:
    - [x] getCurrentCommand() to get command without prompt
    - [x] waitForPrompt() to wait for terminal ready state
    - [x] clearLine() using Ctrl+C
- [x] Migrate TutorialPage functionality
  - [x] Added tutorial/game mode locators to TerminalPage
  - [x] Added typeKeys() and pressEnter() methods
  - [x] Updated tutorial.spec.ts to use TerminalPage
  - [x] Removed TutorialPage.ts
- [x] Fix signal access in e2e tests
  - [x] Created exposeSignals helper to expose commandLineSignal
  - [x] Updated main.tsx to expose signals in dev/test environments
  - [x] Added proper signal waiting in TerminalPage methods
  - [x] Improved timing handling for command updates

## Signal Access in E2E Tests Explanation

The signal access issue arose from how Playwright interacts with the application's state. While the signals are exported and used within the React application, Playwright runs in a separate context and can't directly access these signals. Here's why the fix was needed:

1. **Browser/Test Isolation**: Playwright tests run in a separate JavaScript context from the application. Even though we export the signals in our application code, these exports aren't automatically available to the browser's window object where Playwright can access them.

2. **Signal Timing**: React's state updates (including signals) are asynchronous. When typing or executing commands, we need to ensure the signal has been updated before trying to read its value.

The solution works by:

1. **Signal Exposure**: The exposeSignals helper explicitly attaches the commandLineSignal to the window object, making it accessible from the browser context where Playwright runs.

2. **Initialization Timing**: We expose the signals when the app initializes (in main.tsx), but only in development/test environments to avoid exposing internal state in production.

3. **Waiting Mechanisms**: The TerminalPage methods now wait for:
   - Signal availability (ensuring the signal is exposed)
   - Signal updates (ensuring we get the latest value after actions)

This approach bridges the gap between the application's state management and Playwright's test environment, ensuring reliable access to the command line state during tests.
