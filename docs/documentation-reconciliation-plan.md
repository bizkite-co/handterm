# Documentation Reconciliation Plan

**Goal:** Reconcile documentation in `docs/` (excluding `docs/worklog/`) with current architectural decisions and implementation progress, focusing on state management, terminal implementation (XTerm to Monaco Editor migration), and overall documentation cleanup.

**Phase 1: Information Gathering and Initial Review (Completed)**
*   Listed all files in `docs/` (excluding `docs/worklog/`).
*   Identified potentially relevant documents based on the user's prompt.
*   Clarified with the user that a comprehensive review is required.

**Phase 2: Detailed Document Review and Analysis**

I will read the following documents to understand their content and identify areas for reconciliation. I will prioritize files directly related to the core issues.

**2.1 State Management Review:**

*   **`docs/usestate-vs-signals.md`**:
    *   **Purpose:** Understand the initial rationale for choosing signals over `useState`.
    *   **Focus:**
        *   Does it accurately reflect the current state management strategy?
        *   Does it address the `ActivityType` querystring parameter approach for GitHub Pages?
        *   Does it differentiate between querystring-based state and internal, fast states (Game/Tutorial modes)?
        *   Does it mention the `TypeError: Cannot read properties of null (reading 'useRef')` issue and potential solutions (e.g., `Effect` library integration, non-component contexts)?
*   **`docs/adr/arrange-component-state-hierarchy.md`**:
    *   **Purpose:** Review decisions regarding state hierarchy.
    *   **Focus:**
        *   Are these decisions still valid with the current signal implementation and querystring usage?
        *   Are there any conflicts with the current state management practices?
*   **`src/signals/gameSignals.ts`**:
    *   **Purpose:** Directly examine the code where the `useRef` error occurs.
    *   **Focus:**
        *   Understand the context of `useComputed` and its usage.
        *   Identify how signals are being used in non-component contexts.
        *   This will inform potential documentation updates or code changes.
*   **`src/hooks/useActivityMediator.ts`**:
    *   **Purpose:** Understand how `ActivityType` changes are managed.
    *   **Focus:**
        *   Verify the use of querystring parameters for `ActivityType`.
        *   Confirm how different activity types are handled.

**2.2 Terminal Implementation Review (XTerm to Monaco Editor Migration):**

*   **`docs/issues/92-make-the-xterm-into-a-monaco/_index.md`**:
    *   **Purpose:** Overview of the migration issue.
    *   **Focus:** Ensure it reflects the current status and overall goals.
*   **`docs/issues/92-make-the-xterm-into-a-monaco/phase-1-abstraction.md`**:
    *   **Purpose:** Understand the abstraction layer for the terminal.
    *   **Focus:** Is this abstraction still relevant or has it evolved with the Monaco migration?
*   **`docs/issues/92-make-the-xterm-into-a-monaco/phase-1-plan.md`**:
    *   **Purpose:** Review the initial plan for the migration.
    *   **Focus:** Identify completed, in-progress, or abandoned steps.
*   **`docs/issues/92-make-the-xterm-into-a-monaco/phase-2-monaco-impl.md`**:
    *   **Purpose:** Details of Monaco implementation.
    *   **Focus:** Verify if the implementation details are still accurate.
*   **`docs/issues/92-make-the-xterm-into-a-monaco/phase-3-swap.md`**:
    *   **Purpose:** Plan for swapping XTerm with Monaco.
    *   **Focus:** Has this phase been completed? Are there any lingering XTerm references?
*   **`docs/issues/92-make-the-xterm-into-a-monaco/phase-4-effect-cleanup.md`**:
    *   **Purpose:** Cleanup related to the migration.
    *   **Focus:** What cleanup was planned, and what remains to be done?
*   **`docs/worklog/monaco-editor-reconciliation/_index.md`**:
    *   **Purpose:** Overview of Monaco reconciliation work.
    *   **Focus:** General status and goals.
*   **`docs/worklog/monaco-editor-reconciliation/worklog/2025-01-15-monaco-editor-reconciliation.md`**:
    *   **Purpose:** Specific worklog entry for Monaco reconciliation.
    *   **Focus:** Detailed actions taken and their outcomes.
*   **`docs/worklog/reconcile-mock-types-with-prod/migrate-from-monaco-editor-react/full-rewrite-checklist.md`**:
    *   **Purpose:** Checklist for migration.
    *   **Focus:** What items on this checklist are still relevant or completed?

**Phase 3: Documentation Cleanup Strategy**

Based on the review in Phase 2, I will propose the following actions:

*   **Identify Redundant/Stale Documents:**
    *   Any documents primarily focused on XTerm implementation that are no longer relevant.
    *   Worklog entries that describe problems already solved or decisions superseded by new architecture.
    *   Documents that have been fully integrated into other, more current documentation.
*   **Propose Mergers/Consolidations:**
    *   Combine related information from multiple documents into a single, authoritative source.
    *   For example, if `phase-1-plan.md` and `phase-2-monaco-impl.md` contain overlapping or sequential information, they might be merged into a more comprehensive "Monaco Editor Migration Guide."
*   **Update Existing Documents:**
    *   Modify `usestate-vs-signals.md` to reflect the current state management strategy, including querystring usage and the `useRef` issue.
    *   Update all Monaco-related documentation to reflect the current status of the migration.
    *   Remove any outdated references to XTerm.
    *   Add details about the `TypeError: Cannot read properties of null (reading 'useRef')` in `src/signals/gameSignals.ts` and its resolution or current status.
*   **Create New Documents (if necessary):**
    *   If there are significant architectural decisions or implementation details not currently documented, propose creating new ADRs or conceptual documents.

**Phase 4: Plan Approval and Execution**

*   Present this detailed plan to the user for review and approval.
*   Once approved, I will proceed with the execution, starting with reading the identified documents.

**Mermaid Diagram for Workflow:**

```mermaid
graph TD
    A[Start: Documentation Reconciliation] --> B{Review Docs/ Directory};
    B --> C{Identify Relevant Docs};
    C --> D[Detailed Review: State Management Docs];
    C --> E[Detailed Review: Terminal Migration Docs];
    D --> F{Analyze State Management Discrepancies};
    E --> G{Analyze Terminal Migration Status};
    F --> H[Propose State Management Doc Updates];
    G --> I[Propose Terminal Migration Doc Updates];
    H & I --> J{Identify Redundant/Stale Docs};
    J --> K[Propose Doc Cleanup (Merge/Remove)];
    H & I & K --> L[Consolidate Proposed Changes];
    L --> M[Present Plan to User];
    M --> N{User Approval?};
    N -- Yes --> O[Execute Plan (Read, Update, Cleanup)];
    N -- No --> M;
    O --> P[End: Documentation Reconciled];