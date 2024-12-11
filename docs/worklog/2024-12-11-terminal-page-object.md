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

The TerminalPage class now provides a comprehensive interface for interacting with the terminal in e2e tests, with methods for:
- Typing and executing commands
- Reading terminal output
- Waiting for specific output text or prompt
- Managing terminal focus and command line state
- Handling the terminal prompt consistently
- Supporting tutorial progression testing

The implementation consolidates all terminal-related test functionality into a single, well-organized page object, making the tests more maintainable and the test infrastructure more cohesive.
