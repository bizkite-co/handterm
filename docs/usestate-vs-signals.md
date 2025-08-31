
Current Situation (Props/State/Refs):

```mermaid
graph TD
    A[App] --> B[HandTermWrapper]
    B --> C[Terminal Component]
    B --> D[useTerminal Hook]
    D --> E[useCharacterHandler Hook]

    subgraph State Flow
        B1[isInLoginProcess State] --> B2[setIsInLoginProcess]
        B2 --> D1[useTerminal props]
        D1 --> E1[useCharacterHandler props]
    end

    subgraph Ref Access
        L[LoginCommand] --> R[handTermRef]
        R --> B2
    end

    style State Flow fill:#f9f,stroke:#333
    style Ref Access fill:#bbf,stroke:#333
```

Proposed Solution (Using Signals):

```mermaid
graph TD
    A[App] --> B[HandTermWrapper]
    B --> C[Terminal Component]
    B --> D[useTerminal Hook]
    D --> E[useCharacterHandler Hook]

    subgraph Signal State
        S1[loginSignals.ts]
        S1 --> |isInLoginProcess| B
        S1 --> |isInLoginProcess| D
        S1 --> |isInLoginProcess| E
        S1 --> |isInLoginProcess| L[LoginCommand]
    end

    subgraph Other Signals
        S2[appSignals.ts] --> |isLoggedIn| B
        S2 --> |userName| B
    end

    style Signal State fill:#9f9,stroke:#333
    style Other Signals fill:#ff9,stroke:#333
```

## State Management Considerations

### ActivityType and Querystring Parameters

Due to GitHub Pages limitations, `ActivityType` changes are managed via querystring parameters. This approach ensures that the application state is reflected in the URL, allowing for shareable links and proper navigation within the GitHub Pages environment.

### Internal Game and Tutorial States

For smaller, faster states within Game and Tutorial modes, querystring parameters should *not* be used. These states are typically transient and do not require URL persistence. Instead, they should leverage internal signal management for optimal performance and responsiveness.

### `useComputed` and React Component Lifecycle

A `TypeError: Cannot read properties of null (reading 'useRef')` has been observed in `src/signals/gameSignals.ts` related to `useComputed` being called outside a React component's render cycle. This highlights a critical architectural consideration:

*   `useComputed` (and other React hooks like `useRef`, `useState`, `useEffect`) must only be called from within a React function component or a custom React Hook.
*   When signals are consumed or derived in non-component contexts (e.g., plain JavaScript modules), direct `computed` from `@preact/signals` should be used, not `useComputed` from `@preact/signals-react`.
*   This issue indicates a need to re-evaluate how signals are used in non-component contexts or how `Effect` library integration might impact this, ensuring that React-specific hooks are used appropriately within the React component tree.