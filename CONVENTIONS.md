---
title: Conventions
description: This file describes the rules that should be followed with sovling a task.
date: 2024-12-16
---

Check `pwd` to determine which project you're running CLI commands in.

Create ONE work item description file per conversation in `docs/worklog/`. Use the date of this document above `date: <todays-date>` value, or use `date "+%Y-%m-%d"` to get the local system date to use along with a task title you creat in the file name.

Run `npm run lint` after editing each file to ensure the changes you're making are _reducing_ the number of linting problems.

Specify the intended work with checkboxes and update the checkboxes or modify the changes _after_ any successes, such as solved linting or solved tests.