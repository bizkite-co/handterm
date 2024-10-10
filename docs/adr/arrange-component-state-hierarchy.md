# Arrange Component and State Hierarchy

## Component State Interactions

1. Component-Specific State:
   - Editor state (like editContent, editFilePath, etc.) should indeed be managed within the MonacoEditor.tsx and related files.
   - Game state should be managed within the Game component.
     - The game needs access to the terminal state, which controls the game.
   - Terminal-specific state should stay within the Terminal component.

2. Shared/Global State:
   - Keep only truly global states in AppContext, such as:
     - currentActivity
     - Command output history
     - isLoggedIn
     - userName
   - These are states that genuinely affect multiple components or the overall app behavior.

3. Command Handling:
   - Use CommandContext to manage command-related state and functions:
     - executeCommand
     - commandHistory
     - WPM calculation

4. Terminal Management:
   - Use useTerminal hook for xterm-specific functionality:
     - xtermRef
     - commandLine
     - writeToTerminal
     - resetPrompt

5. Activity Mediation:
   - Use ActivityMediatorContext for managing transitions between different activities (normal, game, tutorial, edit).

Here's a simple example of how you might document your component and state structure:

```
App
├── AppContext (global state)
│   ├── currentActivity
│   ├── Command output history
│   ├── isLoggedIn
│   └── userName
├── Terminal
│   ├── State: commandHistory, currentCommand
│   └── Context: TerminalContext (if needed)
├── Editor
│   ├── State: editContent, editFilePath, isEditMode
│   └── Context: EditorContext (if needed)
├── Game
│   ├── State: gameState, score, currentCommand, animation level, challenge phrase
│   └── Context: GameContext (if needed)
└── Authentication
    ├── State: authStatus
    └── Context: AuthContext
```

```mermaid
flowchart TD
    A[App] --> AC[AppContext]
    AC --> T[Terminal]
    AC --> E[Editor]
    AC --> G[Game]


    T --> |Uses| TS[TerminalState]
    E --> |Uses| ES[EditorState]
    G --> |Uses| GSt[GameState]

    subgraph history
      direction TB
      AC --> |Updates| CI[commandHistory]
      AC --> TO[Terminal<br/>Ouput]
    end

    TS --> |Updates| CLI[currentCommandLine]
    ES --> |Updates| EC[editContent]
    GSt --> |Updates| GSc[gameScore]

    CLI --> |Updates| GSt

    U[User Input] --> |Triggers| T
    T --> |Triggers| E
    T --> |commandLine,Command| G
    T ==> |Command| AC

    N[API] --> |Fetches Data| AC

    subgraph auth
      direction TB
      AC --> |Updates Global State| O[isLoggedIn]
      AC --> |Updates Global State| UN[userName]
    end
```

## `currentActivy` State Flow

1. The `ActivityMediatorProvider` wraps the main `App` component and provides the `ActivityMediatorContext`.

2. The `ActivityMediatorContext` contains the `currentActivity` state and methods to update it.

3. Various components (HandTermWrapper, TutorialManager, and others) consume the ActivityMediatorContext.

4. The `useActivityMediator` hook is used to interact with the ActivityMediatorContext.

5. When a command is executed (either through user interaction or programmatically), it triggers the `handleCommandExecuted` function.

6. `handleCommandExecuted` calls `determineActivityState`, which decides whether to update the `currentActivity`.

7. If an update is needed, the `currentActivity` in the ActivityMediatorContext is updated.

8. This update triggers re-renders in components that depend on `currentActivity`.

### update

1. Keeps the `currentActivity` state in the `ActivityMediatorContext`, making it globally accessible.
2. Maintains the `useActivityMediator` hook with all its existing functionality.
3. Updates `useActivityMediator` to use the `currentActivity` from the context, ensuring consistency across the app.
4. Allows for a gradual refactoring process, as you can slowly move more functionality into the context if needed in the future.


```mermaid
flowchart TD
    A[App] --> AC[ActivityMediatorContext]
    AC --> |Provides currentActivity| UAM[useActivityMediator]
    UAM --> T[Terminal]
    UAM --> E[Editor]
    UAM --> G[Game]

    T --> |Uses| TS[TerminalState]
    E --> |Uses| ES[EditorState]
    G --> |Uses| GSt[GameState]

    subgraph ActivityMediatorContext
      direction TB
      AC --> |Manages| CA[currentActivity]
      UAM --> |Reads| CA
      UAM --> |Provides| DAS[determineActivityState]
      UAM --> |Provides| HCE[handleCommandExecuted]
    end

    TS --> |Updates| CLI[currentCommandLine]
    ES --> |Updates| EC[editContent]
    GSt --> |Updates| GSc[gameScore]

    CLI --> |Updates| GSt

    U[User Input] --> |Triggers| T
    T --> |Triggers| E
    T --> |commandLine,Command| G
    T ==> |Command| HCE
    HCE --> |Calls| DAS
    DAS --> |Updates| CA
```