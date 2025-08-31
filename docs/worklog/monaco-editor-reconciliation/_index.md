---
title: Monaco Editor Reconciliation
---

**Note:** This document is being reconciled with the current implementation progress as part of a broader documentation reconciliation effort. For a comprehensive overview of the reconciliation process, refer to [`docs/documentation-reconciliation-plan.md`](docs/documentation-reconciliation-plan.md).

This document outlines the ongoing effort to integrate the Monaco Editor into the project, replacing XTerm. The goal is to achieve a fully functional Monaco-based terminal with features like persistent auto-saved prompts and robust command handling.

We had a working Monaco file editor in this project in the `github-save` commit. A git diff of the older working file with the current `MonacoEditor.tsx` is available at `temp/monaco_9a487aa3bc01e0981ee9d43151dcd5bcb9c389b3_HEAD.diff`. The primary task is to reconcile the old working file with the new linted-but-not-working Monaco editor.

We are continuing to use `import Editor, { Monaco } from "@monaco-editor/react";` as this library from Qovery has proven to be React-friendly and actively maintained.

## Current Status & Next Steps

The Monaco Editor integration is in progress. Phase 1 (Abstraction & Preparation) of the XTerm to Monaco migration is completed, as detailed in [`docs/issues/92-make-the-xterm-into-a-monaco/_index.md`](docs/issues/92-make-the-xterm-into-a-monaco/_index.md).

The following are the immediate next steps for the Monaco Editor reconciliation:

1.  **Revert back to `@monaco-editor/react` imports:** Ensure all Monaco-related imports consistently use `@monaco-editor/react`.
2.  **Remove `monaco-editor` package:** Remove the `monaco-editor` package from dependencies in `package.json` and resolve any linting errors that arise.
3.  **Update component implementation:** Adapt the component implementation to fully leverage React-specific hooks and patterns provided by `@monaco-editor/react`.
4.  **Verify editor functionality:** Thoroughly test and verify that the Monaco editor's functionality matches the `github-save` version, including:
    *   File editing functionality.
    *   File saving implementation, including GitHub save functionality and integration with `GitHubCommand`.
    *   Vim mode integration and all editor modes.
5.  **Address Playwright test failures:** Investigate and resolve issues causing Playwright tests to fail, particularly those related to tree view toggle and editor initialization in the test environment.
6.  **Update related files:** Modify any other files in the codebase that need to be updated to align with the new Monaco Editor implementation.
7.  **Document changes:** Update `MonacoEditor.md` and add documentation for Vim mode and other new features.

For detailed worklog entries, refer to [`./worklog/2025-01-15-monaco-editor-reconciliation.md`](./worklog/2025-01-15-monaco-editor-reconciliation.md).