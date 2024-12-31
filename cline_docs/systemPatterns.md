# System Patterns

## Architecture Overview

- Vite
- React
- TypeScript
- Vitest
- Playwright
- ESLint
- @xterm/xterm
- Monacaco editor
- @preact/signals-react

## Key Technical Decisions

* Prefer functional components and other modern React best practices.
* Prefer to move code in the functional direction and to use `hooks` when most appropriate.
* Use `@preact/signals-react` for state management, if appropriate.
* Document linting rules justification in the context of the technology compbiations used.

## Design Patterns

## Existing Patterns

1. **Strategy Pattern** - Used in Persistence.ts to allow different persistence implementations
2. **Component Pattern** - React functional components used throughout the UI
3. **Type Safety Patterns** - TypeScript type guards and type assertions
4. **Custom Hooks Pattern** - Reusable logic encapsulated in custom hooks
5. **Mediator Pattern** - useActivityMediator.ts coordinates between components
6. **Observer Pattern** - useReactiveLocation.ts observes and reacts to location changes
7. **Utility Pattern** - Helper functions and classes in utils directory
8. **Singleton Pattern** - GamePhrases.ts and Logger.ts ensure single instances
9. **Factory Pattern** - createLogger function creates logger instances
10. **Adapter Pattern** - apiClient.ts adapts different API request formats
11. **Builder Pattern** - dom.ts builds HTML elements programmatically
12. **State Persistence Pattern** - signalPersistence.ts manages persistent state

## Suggested Patterns

1. **Context Pattern** - For global state management across components
2. **Higher-Order Component Pattern** - For cross-cutting concerns like authentication
3. **Compound Component Pattern** - For building complex UI components
4. **Render Props Pattern** - For flexible component composition
5. **Reducer Pattern** - For managing complex state transitions
6. **Dependency Injection Pattern** - For better testability and loose coupling
7. **Proxy Pattern** - For API request caching and optimization
8. **Decorator Pattern** - For extending component functionality
9. **Command Pattern** - For implementing undo/redo functionality
10. **Flyweight Pattern** - For optimizing memory usage with shared objects
