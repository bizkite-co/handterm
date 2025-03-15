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
4.  **Create UI elements for mode switching:** Add UI elements (e.g., buttons, a toggle switch) to allow the user to switch between modes. These elements will call the `toggleWebContainer` function.
5.  **Update existing commands:** Modify existing commands (or create new ones) to interact with the WebContainer when `isWebContainerActive` is true. For example, a `wcls` command could be used to execute `ls` within the WebContainer.
6. **Testing:**
    * Create a test to verify that we can activate Webcontainer mode.
    * Create a test to verify that we can deactivate Webcontainer mode.
    * Create a test to verify that commands are executed correctly in normal mode.
    * Create a test to verify that commands are executed correctly in WebContainer mode.

7. **Commit:** Commit the changes with a message that does not contain backticks.
