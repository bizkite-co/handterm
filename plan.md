# Dependency Resolution Plan

## Problem

Encountered an `ERESOLVE` error during `npm install`, indicating a dependency conflict between `typescript@5.8.2` and `eslint-plugin-functional@4.4.1`.

## Steps Taken

1.  **Inspected `package.json`:** Verified the declared dependencies:
    *   `typescript`: `~5.8.2`
    *   `eslint-plugin-functional`: `^4.0.0-rc1`
2.  **Checked for `eslint-plugin-functional` updates:** Used `npm info eslint-plugin-functional` and found that the latest version is `9.0.1`, which depends on newer versions of `@typescript-eslint/utils`, suggesting compatibility with newer TypeScript versions.
3.  **Updated `eslint-plugin-functional`:** Modified `package.json` to use `eslint-plugin-functional@^9.0.1`.
4.  **Checked for `eslint` updates:** Used `npm info eslint` and found the latest 9.x version is `9.22.0`.
5.  **Updated `eslint`:** Modified `package.json` to use `eslint@^9.22.0`.
6. **Ran `npm install`:** Encountered new peer dependency conflicts with `eslint-plugin-total-functions` and `@typescript-eslint/*` packages.
7. **Plan to use `--legacy-peer-deps`:** Will run `npm install --legacy-peer-deps` to ignore peer dependency conflicts and proceed with installation.
8. **Run tests:** After installation, run tests to ensure everything works as expected.
9. **Address linting errors:** If tests pass, address any linting errors.
