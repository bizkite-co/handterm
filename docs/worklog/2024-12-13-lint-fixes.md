# Lint Fixes

Work items:
- [x] Run npm run lint to identify issues
- [x] Review and fix identified linting problems:
  - Fixed unused 'data' parameter warning by prefixing with '_'
  - Replaced `window as any` casts with proper interface type `WindowWithXtermCallback`
  - Cleaned up duplicate code by creating a reusable `createTriggerTerminalInput` function
  - Added proper TypeScript interface for window extensions
- [x] Verify fixes by running lint again - all issues resolved

Changes made to src/test-utils/setup.ts have resolved all linting issues.
