# Choose Command Line State locus

### Naming Conventions

In this document, component names should be thought of as abstract objects:

* `HandTermWrapper` is the parent UI component that calls hooks and functional TSX components.
* `XtermAdapter` is a child functional component of the `HandTermWrapper` that implements the Terminal library where the `commandLine` is displayed.
* `useCommandHistory` is a hook that can update the `commandLine` based on events in the `XtermAdapter`.

# Choose Command Line State Locus

## Decision: Move `commandLine` state into `useTerminal` hook

### Context

The application requires robust terminal functionality, including command input, history, and interaction with various application activities. The `commandLine` state, representing the current input in the terminal, is a critical piece of this functionality. Initially, there was a discussion about whether to keep this state at a higher level (e.g., `HandTermWrapper`) or move it closer to the terminal implementation.

### Decision

The `commandLine` state and all related terminal input logic have been moved into the `useTerminal` custom hook. This hook now encapsulates the entire terminal interaction, including handling character input, command line updates, and integration with command history.

### Status

Accepted and Implemented.

### Consequences

#### Positive:

1.  **Encapsulation:** All terminal-related state and logic are now centralized within the `useTerminal` hook. This makes the code more modular, easier to understand, and simpler to maintain.
2.  **Reduced Prop Drilling:** The need to pass `commandLine` and its setter down through multiple components has been eliminated, simplifying component interfaces and improving code readability.
3.  **Improved Performance:** By managing the `commandLine` state closer to its primary usage within the terminal logic, unnecessary re-renders in parent components are reduced.
4.  **Single Source of Truth:** The `useTerminal` hook serves as the definitive source of truth for the terminal's input state, minimizing inconsistencies between the visual terminal and the React state.
5.  **Easier Testing:** Encapsulating all terminal logic within a custom hook simplifies unit testing of terminal functionality, as it reduces the need for extensive mocking of entire React components.
6.  **Separation of Concerns:** This approach clearly delineates terminal concerns from other application logic, facilitating independent reasoning about and modification of terminal behavior.
7.  **Reusability:** The `useTerminal` hook can be easily reused in other parts of the application if similar terminal functionality is required, without carrying over unrelated component logic.
8.  **Simplified State Updates:** State updates are managed internally within the hook, ensuring that the `commandLine` state remains synchronized with the terminal display, thereby reducing the likelihood of race conditions or out-of-sync states.

#### Negative:

1.  **Increased Hook Complexity:** The `useTerminal` hook itself becomes more complex due to the consolidated logic.
2.  **Learning Curve:** Developers unfamiliar with custom hooks or this specific architectural pattern might experience a slight learning curve.

### Options Considered

1.  **Keeping state in `HandTermWrapper`:** This would have led to more prop drilling and a less cohesive terminal logic.
2.  **Using React Context for terminal state:** While an option for subtree state, it would have introduced more boilerplate than a custom hook for this specific, encapsulated functionality.
3.  **Moving state to custom hook (`useTerminal`):** This option was chosen due to the significant benefits in encapsulation, reusability, and maintainability.

This architectural change aligns well with React best practices and contributes to a more maintainable and performant application.