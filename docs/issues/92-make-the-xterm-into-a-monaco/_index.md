---
title:	Make the XTerm into a Monaco
state:	OPEN
author:	InTEGr8or
labels:
comments:	0
assignees:
projects:
milestone:
number:	92
---

I don't think we need to have two different types of text panes. This is speculative, but I think we can simplify things A LOT by getting rid of XTerm and using Monaco for the prompt. One thing it would do is allow a persistent auto-saved prompt. The biggest hurdle would probably be making the Enter key send()

---

## Implementation Plan: XTerm to Monaco Migration

This document outlines the phased approach for replacing the XTerm.js terminal with the Monaco Editor.

**Note:** This document is being reconciled with the current implementation progress. Some statuses may reflect the initial plan and will be updated. For a comprehensive overview of the reconciliation process, refer to [`docs/documentation-reconciliation-plan.md`](docs/documentation-reconciliation-plan.md).

### Phase 1: Abstraction & Preparation

*   **Status:** Completed
*   **Details:** [Phase 1: Abstraction & Preparation](./phase-1-abstraction.md)

The goal of this phase was to refactor the existing code to isolate the terminal's implementation details behind a generic, strictly-typed interface using `Effect Schema`. This phase is now complete.

### Phase 2: Monaco Implementation

*   **Status:** In Progress (Implementation of Monaco components and hooks)
*   **Details:** [Phase 2: Monaco Implementation](./phase-2-monaco-impl.md)

*   **Current Plan:** [Phase 2: MonacoCore Refactor and Terminal Integration Plan](./phase-2-monaco-core-refactor-plan.md)
    *   **Summary:** This plan outlines the refactoring of `MonacoCore.tsx` to support both editor and terminal modes, adapting `useMonacoTerminal.ts` to interact with it, creating `MonacoTerminal.tsx` as a wrapper, and integrating it into `HandTermWrapper.tsx` to display the terminal output.
A new hook and component will be created to implement the `ITerminalAdapter` interface using the Monaco Editor.

### Phase 3: The Swap

*   **Status:** Planned
*   **Details:** [Phase 3: The Swap](./phase-3-swap.md)

The XTerm implementation will be swapped with the Monaco implementation using a feature flag for safe integration testing.

### Phase 4: `Effect` State Machine & Cleanup

*   **Status:** Planned
*   **Details:** [Phase 4: `Effect` State Machine & Cleanup](./phase-4-effect-cleanup.md)

The terminal's internal state management will be refactored to use the `Effect` library, and all legacy XTerm code will be removed.
