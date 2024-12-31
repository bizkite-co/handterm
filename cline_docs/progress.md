# Progress Tracking

## Completed Features

* The `@xterm/xterm` TUI is working.
* The Monaco editor is working.
* The site connects to a AWS Cognito Lambda function which also stores credentials for the user's GitHub account, if they connect it.
* The user can list their recent repos on GitHUb and get a treeview of the files in the repo, and edit and save files.
* A best current state of linting rules has been achieved, although we can alwaays improve the linting rules to improve code quality. We should never change linting rules just to get files to pass, unless we are sure that that rule is not needed and won't improve quality on that file. The linting strategy is discussed at length in the `docs/linting` folder.

## Pending Work

* Allow logged in users to edit and save AWS S3 files in their own bucket/prefixed folder.
* Fix remaining linting errors.
* Get all current tests to work.
* Add a new test for the new feature.

## Current Status

* There are files with linting errors.
* There are tests that are not working.
* There are no tests for the new feature.
