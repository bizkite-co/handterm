# Phase 1: Abstraction & Preparation

*   **Status:** In Progress
*   **Parent:** [_index.md](./_index.md)

## Tasks

*   [x] Install `@effect/schema` dependency.
*   [x] Create `src/types/terminal.ts`.
*   [x] Define `ITerminalAdapter` interface using Effect Schema.
*   [x] Refactor `useTerminal` hook to implement `ITerminalAdapter`.
*   [x] Update `HandTermWrapper.tsx` to use the `ITerminalAdapter` interface.
*   [ ] Run integration tests to verify no regressions.

## Notes & Issues

*   **[Resolved]** There was a persistent issue with the `vitest` configuration for handling CSS imports from `monaco-editor`. This was fixed by adding an esbuild plugin to `vite.config.ts` to mock the CSS files.
*   Integration tests are still failing after the refactoring. The remaining issues are in `HandTermWrapper.test.tsx` and `useActivityMediator.test.ts`.
