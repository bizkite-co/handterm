# Plan for Documentation Reconciliation

**Goal:** Reconcile the documentation in the `docs/` directory (excluding `docs/worklog/`) with current architectural decisions and implementation progress, focusing on state management, terminal implementation, and documentation cleanup.

---

#### Phase 1: Document Inventory and Categorization (Completed)

I have listed and categorized all relevant documents in the `docs/` directory (excluding `docs/worklog/`).

**Categorized Documents:**

*   **State Management:**
    *   [`docs/usestate-vs-signals.md`](docs/usestate-vs-signals.md)
    *   [`docs/adr/arrange-component-state-hierarchy.md`](docs/adr/arrange-component-state-hierarchy.md)
    *   [`docs/adr/choose-commandline-state-locus.md`](docs/adr/choose-commandline-state-locus.md)

*   **Terminal Implementation (XTerm to Monaco Migration):**
    *   [`docs/issues/92-make-the-xterm-into-a-monaco/_index.md`](docs/issues/92-make-the-xterm-into-a-monaco/_index.md)
    *   [`docs/issues/92-make-the-xterm-into-a-monaco/phase-1-abstraction.md`](docs/issues/92-make-the-xterm-into-a-monaco/phase-1-abstraction.md)
    *   [`docs/issues/92-make-the-xterm-into-a-monaco/phase-2-monaco-impl.md`](docs/issues/92-make-the-xterm-into-a-monaco/phase-2-monaco-impl.md)
    *   [`docs/issues/92-make-the-xterm-into-a-monaco/phase-3-swap.md`](docs/issues/92-make-the-xterm-into-a-monaco/phase-3-swap.md)
    *   [`docs/issues/92-make-the-xterm-into-a-monaco/phase-4-effect-cleanup.md`](docs/issues/92-make-the-xterm-into-a-monaco/phase-4-effect-cleanup.md)

*   **General Project Information/Coding Standards:**
    *   [`CONVENTIONS.md`](CONVENTIONS.md)
    *   [`docs/coding_standards.md`](docs/coding_standards.md)
    *   [`docs/product-specification.md`](docs/product-specification.md)
    *   [`docs/prompt-instructions.md`](docs/prompt-instructions.md)
    *   [`docs/lib/_index.md`](docs/lib/_index.md)
    *   [`docs/linting/_index.md`](docs/linting/_index.md)
    *   [`docs/linting/accessibility_rules.md`](docs/linting/accessibility_rules.md)
    *   [`docs/linting/advanced_dependency_resolution.md`](docs/linting/advanced_dependency_resolution.md)
    *   [`docs/linting/configuration_files.md`](docs/linting/configuration_files.md)
    *   [`docs/linting/core_philosophy.md`](docs/linting/core_philosophy.md)
    *   [`docs/linting/custom_eslint_rules.md`](docs/linting/custom_eslint_rules.md)
    *   [`docs/linting/dependency_management.md`](docs/linting/dependency_management.md)
    *   [`docs/linting/dependency_resolution_plan.md`](docs/linting/dependency_resolution_plan.md)
    *   [`docs/linting/error_analysis.md`](docs/linting/error_analysis.md)
    *   [`docs/linting/es_module_compatibility.md`](docs/linting/es_module_compatibility.md)
    *   [`docs/linting/es_module_workaround.md`](docs/linting/es_module_workaround.md)
    *   [`docs/linting/eslint_ecosystem_update_strategy.md`](docs/linting/eslint_ecosystem_update_strategy.md)
    *   [`docs/linting/eslint_type_safety_plugins.md`](docs/linting/eslint_type_safety_plugins.md)
    *   [`docs/linting/general_rules.md`](docs/linting/general_rules.md)
    *   [`docs/linting/ignore_patterns.md`](docs/linting/ignore_patterns.md)
    *   [`docs/linting/import_organization.md`](docs/linting/import_organization.md)
    *   [`docs/linting/import_rules.md`](docs/linting/import_rules.md)
    *   [`docs/linting/incremental_eslint_adoption.md`](docs/linting/incremental_eslint_adoption.md)
    *   [`docs/linting/incremental_plugin_adoption.md`](docs/linting/incremental_plugin_adoption.md)
    *   [`docs/linting/maintenance.md`](docs/linting/maintenance.md)
    *   [`docs/linting/migration_guide.md`](docs/linting/migration_guide.md)
    *   [`docs/linting/naming_conventions.md`](docs/linting/naming_conventions.md)
    *   [`docs/linting/overrides.md`](docs/linting/overrides.md)
    *   [`docs/linting/plugin_impact_analysis.md`](docs/linting/plugin_impact_analysis.md)
    *   [`docs/linting/promise_handling.md`](docs/linting/promise_handling.md)
    *   [`docs/linting/react_best_practices.md`](docs/linting/react_best_practices.md)
    *   [`docs/linting/react_hooks_rules.md`](docs/linting/react_hooks_rules.md)
    *   [`docs/linting/react_rules.md`](docs/linting/react_rules)
    *   [`docs/linting/subtle_type_bugs.md`](docs/linting/subtle_type_bugs.md)
    *   [`docs/linting/testing_standards.md`](docs/linting/testing_standards.md)
    *   [`docs/linting/type_safety_encouragement.md`](docs/linting/type_safety_encouragement.md)
    *   [`docs/linting/type_safety_strategies.md`](docs/linting/type_safety_strategies.md)
    *   [`docs/linting/type_safety.md`](docs/linting/type_safety.md)
    *   [`docs/linting/typescript_rules.md`](docs/linting/typescript_rules.md)
    *   [`docs/linting/refactoring/NextCharsDisplay.md`](docs/linting/refactoring/NextCharsDisplay.md)

*   **Stale/Redundant (Initial Assessment):**
    *   [`docs/linting/CREATE_LINTING_DOCS_PROMPT.md`](docs/linting/CREATE_LINTING_DOCS_PROMPT.md) (Likely a prompt for generating docs, not a doc itself).
    *   [`docs/linting/IMPLEMENT_LINTING_RULES_FROM_DOCS.md`](docs/linting/IMPLEMENT_LINTING_RULES_FROM_DOCS.md) (Similar to above).
    *   [`docs/issues/92-make-the-xterm-into-a-monaco/phase-1-plan.md`](docs/issues/92-make-the-xterm-into-a-monaco/phase-1-plan.md) (Detailed plan for Phase 1, now complete and summarized elsewhere).
    *   [`docs/lib/_index.md`](docs/lib/_index.md) (Redundant as `docs/lib/` contains no other files).
    *   [`docs/adr/_index.md`](docs/adr/_index.md) (Redundant as all ADRs are individual files).

---

#### Phase 2: Detailed Review and Proposed Changes (Completed)

This phase involved reading the identified documents and proposing specific updates.

1.  **Review State Management Documents:**
    *   **Action:** Read [`docs/usestate-vs-signals.md`](docs/usestate-vs-signals.md), [`docs/adr/arrange-component-state-hierarchy.md`](docs/adr/arrange-component-state-hierarchy.md), and [`docs/adr/choose-commandline-state-locus.md`](docs/adr/choose-commandline-state-locus.md).
    *   **Proposed Changes:**
        *   Updated [`docs/usestate-vs-signals.md`](docs/usestate-vs-signals.md) to clearly articulate the decision to use querystring parameters for `ActivityType` due to GitHub Pages limitations, distinguish between querystring-managed `ActivityType` and internal, fast states, and address the `TypeError: Cannot read properties of null (reading 'useRef')` issue with `useComputed`. Updated Mermaid diagrams.
        *   Updated [`docs/adr/arrange-component-state-hierarchy.md`](docs/adr/arrange-component-state-hierarchy.md) to explicitly mention `ActivityType` and querystring parameters as a specific case for global app state, and to reflect the `ITerminalAdapter` abstraction in Mermaid diagrams.
        *   Updated [`docs/adr/choose-commandline-state-locus.md`](docs/adr/choose-commandline-state-locus.md) to reflect the decision to move `commandLine` state into `useTerminal`.

2.  **Review Terminal Implementation Documents:**
    *   **Action:** Read [`docs/issues/92-make-the-xterm-into-a-monaco/_index.md`](docs/issues/92-make-the-xterm-into-a-monaco/_index.md), `phase-1-abstraction.md`, `phase-2-monaco-impl.md`, `phase-3-swap.md`, `phase-4-effect-cleanup.md`.
    *   **Proposed Changes:**
        *   Updated the status of Phase 2 in [`docs/issues/92-make-the-xterm-into-a-monaco/phase-2-monaco-impl.md`](docs/issues/92-make-the-xterm-into-a-monaco/phase-2-monaco-impl.md) to "In Progress".
        *   Updated the status of Phase 3 in [`docs/issues/92-make-the-xterm-into-a-monaco/phase-3-swap.md`](docs/issues/92-make-the-xterm-into-a-monaco/phase-3-swap.md) to "Planned".
        *   Updated the status of Phase 4 in [`docs/issues/92-make-the-xterm-into-a-monaco/phase-4-effect-cleanup.md`](docs/issues/92-make-the-xterm-into-a-monaco/phase-4-effect-cleanup.md) to "Planned".
        *   No changes needed for `_index.md` and `phase-1-abstraction.md` as they already reflect the current status.

3.  **Review General Project Information/Coding Standards:**
    *   **Action:** Read [`CONVENTIONS.md`](CONVENTIONS.md), [`docs/coding_standards.md`](docs/coding_standards.md), [`docs/product-specification.md`](docs/product-specification.md), [`docs/prompt-instructions.md`](docs/prompt-instructions.md), and [`docs/linting/_index.md`](docs/linting/_index.md).
    *   **Proposed Changes:**
        *   Updated [`CONVENTIONS.md`](CONVENTIONS.md) to reflect `ActivityType` state management and Monaco Editor as the planned terminal.
        *   Updated [`docs/coding_standards.md`](docs/coding_standards.md) to reflect Monaco Editor as the target terminal, reinforce `ITerminalAdapter`, and add a point about the `Effect` library.
        *   Updated [`docs/product-specification.md`](docs/product-specification.md) to reflect Monaco Editor as the target terminal, update "Current Issues", and add a note about `ActivityType` state management.
        *   Updated [`docs/linting/_index.md`](docs/linting/_index.md) to add a section for `Effect` library linting rules.
        *   No changes needed for `docs/prompt-instructions.md`.

4.  **Propose Documentation Cleanup:**
    *   **Action:** Based on the reviews in steps 1-3, finalized the list of documents to be removed or consolidated.
    *   **Proposed Actions:**
        *   **Remove:**
            *   [`docs/linting/CREATE_LINTING_DOCS_PROMPT.md`](docs/linting/CREATE_LINTING_DOCS_PROMPT.md)
            *   [`docs/linting/IMPLEMENT_LINTING_RULES_FROM_DOCS.md`](docs/linting/IMPLEMENT_LINTING_RULES_FROM_DOCS.md)
            *   [`docs/issues/92-make-the-xterm-into-a-monaco/phase-1-plan.md`](docs/issues/92-make-the-xterm-into-a-monaco/phase-1-plan.md)
            *   [`docs/lib/_index.md`](docs/lib/_index.md)
            *   [`docs/adr/_index.md`](docs/adr/_index.md)

---

#### Phase 3: Plan Presentation and Approval (Completed)

1.  Presented the detailed plan, including proposed changes and cleanup strategy, to the user.
2.  Incorporated feedback from the user.
3.  Wrote the approved plan to a markdown file.

---

### Mermaid Diagram for Documentation Reconciliation Plan

```mermaid
graph TD
    A[Start Doc Reconciliation] --> B{Phase 1: Document Inventory & Categorization};
    B --> C[List all docs/ files (excluding worklog)];
    C --> D[Categorize documents];
    D --> E{Phase 2: Detailed Review & Proposed Changes};
    E --> F[Review State Management Docs];
    E --> G[Review Terminal Implementation Docs];
    E --> H[Review General Project Info/Coding Standards];
    E --> I[Propose Documentation Cleanup];
    I --> J{Phase 3: Plan Presentation & Approval};
    J --> K[Present Detailed Plan to User];
    K --> L[Incorporate User Feedback];
    L --> M[Write Approved Plan to Markdown File];
    M --> N[End Doc Reconciliation];