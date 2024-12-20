## Overrides

Overrides allow you to apply specific ESLint rules to certain files or directories. This is useful for handling different types of code with different requirements, such as test files, configuration files, or TypeScript declaration files.

### Overview

Overrides provide a way to customize ESLint rules for specific file patterns. This allows for:
- Relaxing rules in test files
- Allowing specific syntax in configuration files
- Disabling certain rules in declaration files

### Test Files Override

This override applies to files in the `src`, `e2e`, and `tests` directories that have `.test` or `.spec` in their name, as well as files in the `src/__tests__` and `src/test-utils` directories.

```javascript
{
  files: [
    'src/**/*.{test,spec}.{ts,tsx}',
    'src/__tests__/**/*.[jt]s?(x)',
    'e2e/**/*.[jt]s?(x)',
    'tests/**/*.[jt]s?(x)',
    'src/test-utils/**/*',
  ],
  extends: ['plugin:testing-library/react'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    'testing-library/no-unnecessary-act': 'error',
    'testing-library/prefer-screen-queries': 'error',
    'testing-library/no-wait-for-multiple-assertions': 'error',
    'testing-library/no-render-in-setup': 'off',
    'testing-library/no-node-access': 'error',
    'testing-library/render-result-naming-convention': 'error',
    'testing-library/no-debugging-utils': process.env.CI ? 'error' : 'warn',
  },
},
```

-   **Rationale:**
    -   Extends the `testing-library/react` plugin for better testing practices.
    -   Disables strict TypeScript rules that are not necessary in test files.
    -   Enforces specific testing library rules.
-   **Key Rules:**
    -   `@typescript-eslint/no-explicit-any`: Allows the use of `any` in test files.
    -   `@typescript-eslint/no-non-null-assertion`: Allows non-null assertions in test files.
    -   `@typescript-eslint/no-unsafe-assignment`, `@typescript-eslint/no-unsafe-member-access`, `@typescript-eslint/no-unsafe-call`, `@typescript-eslint/no-unsafe-return`, `@typescript-eslint/no-unsafe-argument`: Disables unsafe type checks in test files.
    -   `testing-library/no-unnecessary-act`: Enforces the use of `act` when updating state in tests.
    -   `testing-library/prefer-screen-queries`: Enforces the use of `screen` queries.
    -   `testing-library/no-wait-for-multiple-assertions`: Prevents multiple assertions in `waitFor` calls.
    -   `testing-library/no-render-in-setup`: Allows rendering in setup functions.
    -   `testing-library/no-node-access`: Prevents direct node access in tests.
    -   `testing-library/render-result-naming-convention`: Enforces naming conventions for render results.
    -   `testing-library/no-debugging-utils`: Disallows debugging utils in CI environments.

### TypeScript Declaration Files Override

This override applies to files with the `.d.ts` extension, including those in the `src` directory.

```javascript
{
  files: ['*.d.ts', 'src/**/*.d.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'import/no-duplicates': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    'import/no-cycle': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/ban-types': 'off',
  },
},
```

-   **Rationale:**
    -   Disables strict TypeScript rules that are not necessary in declaration files.
    -   Allows for more flexibility in type definitions.
-   **Key Rules:**
    -   `@typescript-eslint/no-explicit-any`: Allows the use of `any` in declaration files.
    -   `@typescript-eslint/no-unused-vars`: Allows unused variables in declaration files.
    -   `import/no-duplicates`: Allows duplicate imports in declaration files.
    -   `@typescript-eslint/consistent-type-definitions`: Allows both `type` and `interface` in declaration files.
    -   `import/no-cycle`: Allows circular dependencies in declaration files.
    -   `@typescript-eslint/consistent-type-imports`: Allows regular imports for types in declaration files.
    -   `@typescript-eslint/ban-types`: Allows the use of banned types in declaration files.

### Configuration Files Override

This override applies to files with `.config.ts`, `.config.js`, `vite.config.ts`, `vitest.config.ts`, `webpack.lambda.config.js`, and files in the `scripts` directory.

```javascript
{
  files: [
    '*.config.ts',
    '*.config.js',
    'vite.config.ts',
    'vitest.config.ts',
    'webpack.lambda.config.js',
    'scripts/**/*',
  ],
  rules: {
    '@typescript-eslint/no-var-requires': 'off',
    'import/no-default-export': 'off',
    'no-console': 'off',
  },
},
```

-   **Rationale:**
    -   Allows `require` statements in configuration files.
    -   Allows default exports in configuration files.
    -   Allows console logs in configuration files.
-   **Key Rules:**
    -   `@typescript-eslint/no-var-requires`: Allows `require` statements.
    -   `import/no-default-export`: Allows default exports.
    -   `no-console`: Allows console logs.

### Example Spec File Override

This override applies to the `e2e/example.spec.ts` file.

```javascript
{
  files: [
    'e2e/example.spec.ts',
  ],
  rules: {
    'testing-library/prefer-screen-queries': 'off',
  },
},
```

-   **Rationale:**
    -   Disables the `testing-library/prefer-screen-queries` rule in the example spec file.
-   **Key Rules:**
    -   `testing-library/prefer-screen-queries`: Allows direct queries in the example spec file.

### Best Practices and Recommendations

1. **Use Overrides Sparingly**
   - Only use overrides when necessary.
   - Avoid overusing overrides, as they can make the configuration harder to understand.

2. **Document Overrides**
   - Clearly document the rationale for each override.
   - Explain why specific rules are disabled or modified.

3. **Keep Overrides Specific**
   - Use specific file patterns to target only the files that need the override.
   - Avoid using overly broad file patterns.

### Conclusion

Overrides are a powerful tool for customizing ESLint rules for different parts of your codebase. By using them judiciously and documenting them clearly, you can maintain a consistent and effective linting configuration.
