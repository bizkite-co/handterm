# Choose Command Line State locus

### Naming Conventions

In this document, component names should be thought of as abstract objects:

* `HandTermWrapper` is the parent UI component that calls hooks and functional TSX components.
* `XtermAdapter` is a child functional component of the `HandTermWrapper` that implements the Terminal library where the `commandLine` is displayed.
* `useCommandHistory` is a hook that can update the `commandLine` based on events in the `XtermAdapter`.

## Locus of Command Line state

> Q: I know that the typical React tendency is to move state up, but is there any case to move state down? I am wondering if there might be a reason to move `commandLine` state down to `XtermAdapter`. We will be integrating `useCommandHistory`, and I am wondering if there might be any reason to keep that closer to the `XtermAdapter` level of processing. Or would it be better to centralize user-centric logic like that in the `HandTermWrapper`?

> A: You raise an interesting point about state management in React. While the general principle of "lifting state up" is often recommended, there are indeed cases where moving state down can be beneficial. Let's consider the pros and cons of moving the `commandLine` state down to `XtermAdapter`:

### Pros of moving `commandLine` state to `XtermAdapter`:

1. Localized state management: The `XtermAdapter` is directly responsible for handling user input, so keeping the `commandLine` state there could lead to more encapsulated logic.

2. Performance optimization: If `HandTermWrapper` re-renders frequently due to other state changes, keeping `commandLine` in `XtermAdapter` could prevent unnecessary re-renders of the terminal component.

3. Simplified props: It would reduce the need to pass `commandLine` and its setter as props from `HandTermWrapper` to `XtermAdapter`.

4. Closer to the source: The state would be closer to where it's primarily used and modified, potentially making the code more intuitive.

### Cons of moving `commandLine` state to `XtermAdapter`:

1. Reduced visibility: `HandTermWrapper` and other higher-level components might need access to the current command line state, which would require passing it back up as a prop or through a context.

2. Potential duplication: If other components also need to manage command-related state, you might end up with duplicated logic across different parts of your application.

3. Harder to implement global features: Features like command history or auto-completion that might need to interact with other parts of the application could be more challenging to implement if the state is localized in `XtermAdapter`.

### Regarding `useCommandHistory` hook:

If you're planning to integrate `useCommandHistory`, it might actually make more sense to keep this logic at the `HandTermWrapper` level or even higher. Here's why:

1. Command history is typically a user-level feature that persists across different terminal sessions or even application restarts.

2. It often needs to interact with other parts of the application, such as saving to local storage or syncing with a backend.

3. Other components (like a separate command history display or auto-completion suggestions) might need access to this data.

### Recommendation:

Given the nature of your application and the potential need for command history and other user-centric features, I would recommend keeping the `commandLine` state and related logic (including `useCommandHistory`) in the `HandTermWrapper` or even a dedicated state management solution (like Redux or Recoil) if the application grows more complex.

This approach would:
1. Centralize user-centric logic, making it easier to manage and extend.
2. Allow easier implementation of features that span multiple components.
3. Maintain a clear data flow, with the `HandTermWrapper` acting as the source of truth for terminal-related state.

You can still optimize performance by using `React.memo` or careful prop passing to prevent unnecessary re-renders of the `XtermAdapter` component.

Remember, the best architecture often depends on the specific needs and future plans for your application. If you find that keeping the state in `HandTermWrapper` becomes cumbersome or inefficient as you develop, you can always refactor later.

#### That is a very helpful overview of the issue at hand. With that information I have decided to continue with `commandLine` state in `HandTermWrapper`. Now, I would like to review your recent changes: ```These changes implement the following:

## Update:

#### From your example above, it looks like I should remove `const { handleCharacter } = useCharacterHandler(characterHandlerProps);` and related code from `HandTermWrapper.tsx`? It also looks like we are officially moving `commandLine` state into `useTerminal.ts`? I should update our `choose-commandline-state-locus.md` if that is the case. Can you give me a little more specifics details about the benefits of moving `commandLine` state into `useTerminal` so I can update the Architectural Decision Record properly?

You're correct on both points. Let's address each of these and discuss the benefits of moving the `commandLine` state into `useTerminal`:

1. Removing `useCharacterHandler`:
   Yes, you should remove `const { handleCharacter } = useCharacterHandler(characterHandlerProps);` and related code from `HandTermWrapper.tsx`. The new `useTerminal` hook will handle character input and command line management internally.

2. Moving `commandLine` state into `useTerminal`:
   Yes, we are officially moving the `commandLine` state into the `useTerminal` hook. This is a significant architectural decision that should be reflected in your ADR.

Benefits of moving `commandLine` state into `useTerminal`:

1. Encapsulation: By moving the `commandLine` state into `useTerminal`, we're encapsulating all terminal-related state and logic in one place. This makes the code more modular and easier to maintain.

2. Reduced Prop Drilling: With the state managed inside the hook, we don't need to pass `setCommandLine` down through multiple components, reducing prop drilling and simplifying component interfaces.

3. Improved Performance: By managing the `commandLine` state closer to where it's used (in the terminal logic), we can potentially reduce unnecessary re-renders in parent components.

4. Single Source of Truth: The `useTerminal` hook becomes the single source of truth for the terminal state, reducing the risk of state inconsistencies between the visual terminal and the React state.

5. Easier Testing: With all terminal logic encapsulated in a custom hook, it becomes easier to write unit tests for terminal functionality without needing to mock entire React components.

6. Separation of Concerns: This approach clearly separates terminal concerns from the rest of the application logic, making it easier to reason about and modify terminal behavior independently.

7. Reusability: If you need terminal functionality in other parts of your application, you can easily reuse the `useTerminal` hook without carrying over unrelated component logic.

8. Simplified State Updates: By handling state updates within the hook, we can ensure that the `commandLine` state is always in sync with what's displayed in the terminal, reducing the chances of race conditions or out-of-sync states.

For your ADR, you might want to include these points:

1. Context: We needed to manage terminal state and functionality in a React application.
2. Decision: Move the `commandLine` state and related terminal logic into a custom `useTerminal` hook.
3. Status: Accepted
4. Consequences:
   - Positive: Improved encapsulation, reduced prop drilling, potential performance improvements, single source of truth for terminal state, easier testing, clear separation of concerns, improved reusability.
   - Negative: Slightly more complex hook implementation, potential learning curve for developers not familiar with custom hooks.
5. Options Considered:
   - Keeping state in `HandTermWrapper`
   - Using React Context for terminal state
   - Moving state to custom hook (chosen option)

This architectural change aligns well with React best practices and should lead to a more maintainable and performant application.