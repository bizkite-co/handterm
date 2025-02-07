---
title: Conventions
description: This file describes the rules that should be followed with sovling a task.
version: 1.0.0
---

This is a React/TypeScript/Vite/Vitest/Palaywright website that is deployed to GitHub Pages.

THIS APP IS A TUI (Text User Interface) and should not include _ANY BUTTONS_. HTML is used only for read-only ouput. All user actions should be keyboard driven.

In order to share TypeScript types that are used in the browser context with Playwright, which works in the Node.js context, we have migrated some types to `packages/types` as `@handterm/types`.

Always check `@handterm/types` for any types that you need to use in both contexts. You can use `./list-types.ts` to list all types in `@handterm/types`.

There is a server-side AWS API Gateway/Lambda backend defined in `/home/mstouffer/repos/handterm-proj/handterm-cdk` and a shared API endpoints in `src/shared/endpoints.json`.

Check `pwd` to determine which project you're running CLI commands in.

1. Use `docs/worklog/` for docmentation. Use the MCP `date-server` to get the local system date if you have to creat a new dated file.
    2. Specify the intended work by using checkboxes to indicate completion.
    3. Initially, ALL CHECKBOXES SHOULD BE UNCHECKED.
    1. Always add multi-line comments to the code file reflecting the latest plannning and design decisions from the planning documents.
       1. Also, add a link to the source planning documents that you are referencing.
    4. Update the checkboxes or modify the changes _after_ any successes, such as solved linting or solved tests.
    5. CHECK THE CHECKBOX TO INDICATE COMPLETION.
    6. AT THE END OF THE WORK ITEM, ALL CHECKBOXES SHOULD BE CHECKED.
    7. NEVER DELETE A CHEECKBOX LINE. If you find that a checkboxed line is not needed, check the checkbox and explain why it is not needed on an indented next line.

Use the VS Code linter after editing each file to ensure the changes you're making are _reducing_ the number of linting problems.

