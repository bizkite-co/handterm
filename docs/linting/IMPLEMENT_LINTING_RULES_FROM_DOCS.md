## Steps to Implement Linting Rules from Documentation

This document outlines the steps required to implement the linting rule decisions documented in the `docs/linting` directory into the project's configuration files.

### 1. Review the Linting Documentation

The first step is to thoroughly review the existing linting documentation to understand the decisions made for each linting rule.

-   Start with the index file: [`./docs/linting/_index.md`](./_index.md). This file provides an overview of the completed sections.
-   Read each of the linked markdown files in the **Completed Sections** to understand the rationale and recommendations for each category of linting rules:
    -   [`./core_philosophy.md`](./core_philosophy.md)
    -   [`./type_safety.md`](./type_safety.md)
    -   [`./promise_handling.md`](./promise_handling.md)
    -   [`./naming_conventions.md`](./naming_conventions.md)
    -   [`./import_organization.md`](./import_organization.md)
    -   [`./react_best_practices.md`](./react_best_practices.md)
    -   [`./testing_standards.md`](./testing_standards.md)
    -   [`./configuration_files.md`](./configuration_files.md)
    -   [`./maintenance.md`](./maintenance.md)
    -   [`./react_rules.md`](./react_rules.md)
    -   [`./typescript_rules.md`](./typescript_rules.md)
    -   [`./import_rules.md`](./import_rules.md)
    -   [`./react_hooks_rules.md`](./react_hooks_rules.md)
    -   [`./accessibility_rules.md`](./accessibility_rules.md)
    -   [`./general_rules.md`](./general_rules.md)
    -   [`./overrides.md`](./overrides.md)
    -   [`./ignore_patterns.md`](./ignore_patterns.md)

### 2. Implement Rule Decisions in `.eslintrc.cjs`

The primary file for configuring ESLint rules is `.eslintrc.cjs`. For each rule discussed in the documentation, find its corresponding entry in `.eslintrc.cjs` and update it according to the documented recommendations.

-   **Locate the `.eslintrc.cjs` file:** This file is located at the root of the project.
-   **Understand the structure:** The file likely exports a configuration object containing `rules`, `extends`, `plugins`, and potentially `overrides`.
-   **Update individual rules:**  For each rule in the documentation, find its name in the `rules` section of `.eslintrc.cjs`.
    -   If the rule's recommendation is to enable it, ensure it's present and set to `'warn'` or `'error'` as appropriate.
    -   If the recommendation is to disable it, ensure it's either removed from the `rules` object or set to `'off'`.
    -   If the recommendation involves specific configurations, update the rule's value accordingly (e.g., `['error', { "max-len": 120 }]`).

**Example:**

If the documentation for the `no-console` rule recommends setting it to `'error'` in production and `'warn'` in development, ensure the `.eslintrc.cjs` has the following configuration:

```javascript
  rules: {
    // ... other rules
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    // ...
  },
```

### 3. Consider Breaking Up `.eslintrc.cjs`

As the number of linting rules grows, `.eslintrc.cjs` can become quite large and difficult to manage. Consider breaking it up into multiple configuration files for better organization.

-   **Possible strategies:**
    -   **Separate files for rule categories:** Create separate files for base rules, React rules, TypeScript rules, etc.
    -   **Environment-specific files:** Have separate files for development and production rules if there are significant differences.
    -   **Override-specific files:**  Move the `overrides` configuration into its own file.

-   **Implementation:**
    -   Use the `extends` property in `.eslintrc.cjs` to reference the other configuration files.
    -   Ensure the order of extension is logical, with more specific configurations overriding general ones.

**Example:**

You could create files like:

-   `.eslintrc.base.cjs` (for core JavaScript/TypeScript rules)
-   `.eslintrc.react.cjs` (for React-specific rules)
-   `.eslintrc.typescript.cjs` (for TypeScript-specific rules)

And then update `.eslintrc.cjs`:

```javascript
module.exports = {
  extends: [
    './.eslintrc.base.cjs',
    './.eslintrc.react.cjs',
    './.eslintrc.typescript.cjs',
    // ... other extensions
  ],
  // ... any specific overrides or configurations in this main file
};
```

### 4. Update `tsconfig.json` and Related Files

Some linting rules might have dependencies on the TypeScript configuration. Review the documentation and update `tsconfig.json` or related `tsconfig.*.json` files as needed.

-   **Check TypeScript-specific rule documentation:**  Rules related to type safety and TypeScript syntax might suggest changes to compiler options.
-   **Modify `tsconfig.json`:** Update the `compilerOptions` section with any recommended changes.

**Example:**

If a rule recommends stricter null checking, you might need to enable the `strictNullChecks` compiler option in `tsconfig.json`:

```json
{
  "compilerOptions": {
    // ... other options
    "strictNullChecks": true,
    // ...
  },
  // ...
}
```

Consider updating `tsconfig.base.json`, `tsconfig.node.json`, and `tsconfig.test.json` if they exist and are relevant to the linting rules being implemented.

### 5. Update Other Configuration Files

Depending on the linting rules, other configuration files might need adjustments.

-   **`.eslintignore`:** Ensure this file correctly excludes any files or directories that should not be linted, as documented in `ignore_patterns.md`.
-   **Editor configuration (e.g., `.editorconfig`):**  While not directly related to ESLint rules, ensure consistency in formatting (e.g., indentation) which can be enforced by some linting rules.

### 6. Testing the Configuration

After implementing the changes, it's crucial to test the new linting configuration.

-   **Run the linter:** Execute the ESLint command to check for linting errors and warnings.
    ```bash
    npm run lint:file <file-path>
    ```
    (The actual command might vary based on the project's `package.json` scripts.)
-   **Address linting issues:** Fix any new linting errors or warnings that arise from the updated configuration.
-   **Verify overrides:** Ensure that the overrides are working as expected by linting files that should have specific rules applied.

### 7. Future Considerations

-   **Gradual adoption:** If making significant changes, consider implementing the rules gradually to avoid overwhelming the team with a large number of new linting errors.
-   **Communication:** Clearly communicate the changes to the team and provide guidance on how to address new linting issues.
-   **Maintenance:** Regularly review the linting configuration and documentation to ensure they remain up-to-date with best practices and project needs.

This document serves as a guide for implementing the documented linting rules. The specific steps and considerations might need to be adjusted based on the project's evolving needs and complexity.
