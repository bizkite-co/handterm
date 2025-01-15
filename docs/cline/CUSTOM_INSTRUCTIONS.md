---
title: Cline Custom Instructions
date: 2025-01-15
version: 1.0.0
---

1. Create a plan for the current task.
    1. Read the contenxt of the project directory.
    2. Use the MCP date server to get the current date.
    3. Create a worklog document in `docs/worklog` prefixed with the current date.
    2. Create a new branch titled `cline-<task-name>` from the curret branch and comit the worklog document to it.
    1. Use the sequential thinking MCP to create a checkboxed bulleted list of tasks and subtasks to carry out for the current conversation.
    2. When work tasks or subtasks are completed, check them off.
    3. If you have to deviate from the plan, use the sequential thinking MCP to edit the worklog, and then start implementing the new plan.
3. Don't create files that already exist.
4. Don't overwrite files without reading the current content first.
5. Use `direnv` and `.envrc` for environmet variables on the local machine, instead of `.env`.
6. Treat the `.envrc` as read-only. If you want to edit it, tell me what it should say.