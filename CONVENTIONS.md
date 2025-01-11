---
title: Conventions
description: This file describes the rules that should be followed with sovling a task.
version: 1.0.0
---

This is a React/TypeScript/Vite/Vitest/Palaywright website that is deployed to GitHub Pages.

There is a server-side AWS API Gateway/Lambda backend defined in `/home/mstouffer/repos/handterm-proj/handterm-cdk` and a shared API endpoints in `src/shared/endpoints.json`.

Check `pwd` to determine which project you're running CLI commands in.

Create ONE work item description file per conversation in `docs/worklog/`. Use the MCP `date-server` to get the local system date to use along with a task title you creat in the file name.

Use the VS Code linter after editing each file to ensure the changes you're making are _reducing_ the number of linting problems.

Specify the intended work by using checkboxes and update the checkboxes or modify the changes _after_ any successes, such as solved linting or solved tests.
