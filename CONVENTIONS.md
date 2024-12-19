---
title: Conventions
description: This file describes the rules that should be followed with sovling a task.
date: 2024-12-18
---

Check `pwd` to determine which project you're running CLI commands in.

Create ONE work item description file per conversation in `docs/worklog/`. Use the date of this document above `date: <todays-date>` value, or use `date "+%Y-%m-%d"` to get the local system date to use along with a task title you creat in the file name.

The `eslint-files.json` contains the list of `filePath`, `errorCount`, and `warningCount` of linted files with problems. Use that file to work through all the files with problems.

The `eslint-files.json` can be refreshed by running `npm run lint:save-files`.

Run `npm run lint -- <edited-file-relative-path>` after editing each file to ensure the changes you're making are _reducing_ the number of linting problems.

To run linting on a single file, use the command `npm run lint -- <filepath>`. Replace `<filepath>` with the path to the file you want to lint.

Specify the intended work with checkboxes and update the checkboxes or modify the changes _after_ any successes, such as solved linting or solved tests.
