# Playwright GitHub Actions Configuration

Work items:
- [x] Review current Playwright configuration
- [x] Check GitHub Actions workflow setup
- [x] Implement solution to start dev server before tests
- [ ] Verify tests pass in CI environment

Issue: Playwright tests failing in GitHub Actions with connection refused error, while passing locally. Error suggests Vite dev server is not running when tests attempt to connect to localhost:5173.

Changes made:
1. Added webServer configuration to playwright.config.ts:
   - Configured to run `npm run dev` before tests
   - Set URL to http://localhost:5173
   - Added 2-minute timeout for server startup
   - Disabled server reuse in CI environment for clean test runs
2. Kept existing CI-specific configurations:
   - Retries enabled only in CI
   - Single worker in CI
   - Trace collection on first retry

The webServer configuration ensures the Vite dev server is running before any tests execute, which should resolve the connection refused errors in the CI environment.
