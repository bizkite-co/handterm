# Coding Standards

## Tech Stack

Vite, TypeScript, React, Monaco Editor (replacing `@xterm/xterm`), web-based TUI developed in VS Code & WSL Terminal.

**Terminal Abstraction:** All terminal interactions should be done through the `ITerminalAdapter` interface to ensure a clean separation of concerns and facilitate the migration to Monaco Editor.

**State Machines:** The `Effect` library is planned for use in managing complex state machines, particularly for the terminal's internal state (Phase 4 of Monaco migration).

## Priorities

* Robust, expert-level React implementation.
* Prefer functional components and other modern React best practices.
* use `props` interfaces and don't destructure `props`. We want clarity on when a `prop` is being used.
* Always prefer to move code in the functional direction and to use `hooks` when most appropriate.