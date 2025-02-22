# Allure Report Investigation - 2025-02-21

**Task:** Investigate Allure Report for improved test reporting and analysis, specifically with Vitest and Playwright.

**Understanding of the Problem:**

Recent changes to the `MonacoCore` component, while fixing unit tests, introduced regressions that caused all Playwright e2e tests to fail. The failures are related to timeouts waiting for the Vim status bar, indicating a problem with the editor's initialization or Vim mode integration. The user suspects over-mocking or incorrect mocks in the unit tests, leading to a false positive. Allure Report is proposed as a solution to provide better visibility into test results and help diagnose the root cause.

**Plan:**

1.  **Research Allure Report Integration:**
    *   **Vitest:**
        *   Installation: `npm install --save-dev @allure/vitest`
        *   Configuration: Add `allure` to the `reporters` array in `vitest.config.ts`. Configure options (output directory, results directory) within the `allure` object.
        *   Usage: Run Vitest tests. Allure report is generated automatically.
    *   **Playwright:**
        *   Installation: `npm install --save-dev allure-playwright`
        *   Configuration: Add `allure-playwright` to the `reporter` array in `playwright.config.ts`.
        *   Usage: Run Playwright tests. Allure report is generated automatically.

2.  **Assess Suitability and Effort:**
    *   **Features:** Allure provides detailed reports (steps, attachments, history).
    *   **Ease of Integration:** Straightforward for both Vitest and Playwright (install package, modify config).
    *   **Maintenance:** Minimal (keep packages updated).
    *   **Reporting:** Visually appealing and informative reports.

3.  **Implementation (if approved by user):**
    *   Install Allure packages for Vitest and Playwright.
    *   Configure Allure in `vitest.config.ts` and `playwright.config.ts`.
    *   Run tests and verify report generation.
    *   Analyze reports to diagnose e2e test failures.

**Next Steps:**

*   Confirm with the user if they approve proceeding with the Allure Report integration based on the initial assessment.