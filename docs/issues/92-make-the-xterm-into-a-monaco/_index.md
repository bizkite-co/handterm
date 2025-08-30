title:	Make the XTerm into a Monaco
state:	OPEN
author:	InTEGr8or
labels:	
comments:	0
assignees:	
projects:	
milestone:	
number:	92
--
I don't think we need to have two different types of text panes. This is speculative, but I think we can simplify things A LOT by getting rid of XTerm and using Monaco for the prompt. One thing it would do is allow a persistent auto-saved prompt. The biggest hurdle would probably be making the Enter key send()

---

## Implementation Plan: XTerm to Monaco Migration

This document outlines the phased approach for replacing the XTerm.js terminal with the Monaco Editor.

### Phase 1: Abstraction & Preparation

*   **Status:** Not Started
*   **Details:** [Phase 1: Abstraction & Preparation](./phase-1-abstraction.md)

The goal of this phase is to refactor the existing code to isolate the terminal's implementation details behind a generic, strictly-typed interface using `Effect Schema`.

### Phase 2: Monaco Implementation

*   **Status:** Not Started
*   **Details:** [Phase 2: Monaco Implementation](./phase-2-monaco-impl.md)

A new hook and component will be created to implement the `ITerminalAdapter` interface using the Monaco Editor.

### Phase 3: The Swap

*   **Status:** Not Started
*   **Details:** [Phase 3: The Swap](./phase-3-swap.md)

The XTerm implementation will be swapped with the Monaco implementation using a feature flag for safe integration testing.

### Phase 4: `Effect` State Machine & Cleanup

*   **Status:** Not Started
*   **Details:** [Phase 4: `Effect` State Machine & Cleanup](./phase-4-effect-cleanup.md)

The terminal's internal state management will be refactored to use the `Effect` library, and all legacy XTerm code will be removed.
