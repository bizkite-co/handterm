## Issue #71: Implement WebContainer Mode Switching

**Context:** This task focuses on implementing the mechanism to switch between executing commands within the WebContainer and the user's local environment.

**Description:**

*   Introduce a mechanism to switch between "WebContainer mode" and "normal mode."
*   Update the `CommandProvider` to handle state transitions between modes.

**Dependencies:**

- #68 (Parent epic)
- #70 (WebContainer Context)

**Plan:**

1.  **Introduce `isWebContainerActive` state:** Add a boolean state variable (e.g., `isWebContainerActive`) to the `CommandProvider` context to track whether the WebContainer is currently active. This avoids adding another URL parameter and keeps the WebContainer integration logic encapsulated within the `CommandProvider`.
2.  **Create `toggleWebContainer` function:** Implement a function within the `CommandProvider` context to toggle the `isWebContainerActive` state. This function will be responsible for handling the transition between modes.
3.  **Modify command execution logic:** Update the `executeCommand` function within `CommandProvider` to check the current `isWebContainerActive` state before executing a command.
    *   If `isWebContainerActive` is `false`, execute the command normally (as it currently does).
    *   If `isWebContainerActive` is `true`, execute the command within the WebContainer instance.
4.  **Create UI elements for mode switching:** Add UI elements (e.g., buttons, a toggle switch) to allow the user to switch between modes. These elements will call the `toggleWebContainer` function.  **Note:** The UI will actually be command-based, not button-based, as this is a TUI. Commands `wc-init` and `wc-exit` will be used.
5.  **Update existing commands:** Modify existing commands (or create new ones) to interact with the WebContainer when `isWebContainerActive` is true. For example, a `wcls` command could be used to execute `ls` within the WebContainer.
6. **Testing:**
    *   Create a test to verify that we can activate Webcontainer mode (`wc-init` command). The URL should change to include `?activity=webcontainer`.
    *   Create a test to verify that we can deactivate Webcontainer mode (`wc-exit` command). The URL should change back to `?activity=normal`.
    *   Create a test to verify that commands are executed correctly in normal mode.
    *   Create a test to verify that commands are executed correctly in WebContainer mode.
    *   **Minimize `localStorage` mocking:** Tests should only set the `localStorage` items that are absolutely necessary for the specific test case.  Start with a clean `localStorage` state (either by relying on Playwright's default behavior or explicitly clearing it).
    *   **Run focused tests:** Use `npx cucumber-js src/e2e/scenarios/webcontainerModeSwitching.feature` to run only the WebContainer mode switching tests.
    *   **Address type errors incrementally:** Initially focus on getting the tests to run, potentially bypassing type errors temporarily (e.g., with `// @ts-nocheck`). Fix type errors after the basic test execution is working.
    *   **Configure Cucumber.js:** Set up Cucumber.js to work correctly with Playwright and TypeScript. This involves creating a `cucumber.config.ts` file and updating `package.json` to use `cucumber-js` as the test runner. The `pretest:e2e` script should compile the TypeScript step definitions to JavaScript before running the tests.
7. **Refactor for URL-based activity state:** Remove any residual uses of `localStorage` or Signals (e.g., `activitySignal`) for managing the *current activity*, relying solely on the URL for determining the active mode/activity.
8. **Commit:** Commit the changes with a message that does not contain backticks.

**Note:** It has been confirmed that Vim/Neovim can be installed and used within the WebContainer.
