
Current State Management Architecture:

```mermaid
graph TD
    A[App] --> B[HandTermWrapper]
    B --> C[useTerminal Hook (ITerminalAdapter)]
    C --> D[XTerm.js Instance]

    subgraph Global State (Querystring Parameters)
        Q[URL Querystring] --> |ActivityType| B
        Q --> |ActivityType| C
    end

    subgraph Global State (Signals)
        S1[appSignals.ts] --> |isLoggedIn, userName| B
        S2[loginSignals.ts] --> |isInLoginProcess| B
        S2 --> |isInLoginProcess| C
    end

    subgraph Internal Fast States (Signals/useState)
        I1[Game Mode Internal States]
        I2[Tutorial Mode Internal States]
    end

    style Global State (Querystring Parameters) fill:#f9f,stroke:#333
    style Global State (Signals) fill:#9f9,stroke:#333
    style Internal Fast States (Signals/useState) fill:#bbf,stroke:#333
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