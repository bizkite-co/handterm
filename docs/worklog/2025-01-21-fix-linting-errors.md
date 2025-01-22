# Fix Linting Errors - 2025-01-21

## Task
Resolve linting errors in files listed in eslint-files.csv:
- src/e2e/tests/tutorial.spec.ts (8 errors)
- playwright-setup.ts (7 errors)
- src/test-utils/exposeSignals.ts (2 errors)
- playwright.config.js (1 error)

## Understanding
The project has a comprehensive ESLint configuration with:
- TypeScript support
- React rules
- Custom rules (eslint-plugin-custom-rules)
- Multiple tsconfig files for different environments
- Extensive linting documentation in docs/linting/

## Plan
1. Review .eslintrc.cjs to understand active rules
2. Examine each file's linting errors
3. Fix errors while maintaining functionality
4. Ensure changes follow project conventions
5. Document fixes in worklog

## Next Steps
1. Read .eslintrc.cjs configuration
2. Analyze tutorial.spec.ts errors
3. Implement fixes for tutorial.spec.ts