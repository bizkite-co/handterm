module.exports = {
  root: true,
  env: {
    browser: true, // Enable browser globals
    es2021: true,  // Enable ES2021 features
    node: true,    // Enable Node.js globals
  },
  // Core rule sets in order of increasing specificity
  extends: [
    'eslint:recommended',                                        // Base JavaScript best practices
    'plugin:@typescript-eslint/recommended',                     // TypeScript best practices
    'plugin:@typescript-eslint/recommended-requiring-type-checking', // Strict TypeScript type checking
    'plugin:@typescript-eslint/strict',                         // Stricter TypeScript rules
    'plugin:react/recommended',                                 // React best practices
    'plugin:react/jsx-runtime',                                 // Modern React JSX features
    'plugin:react-hooks/recommended',                           // React Hooks best practices
    'plugin:jsx-a11y/recommended',                             // Accessibility best practices
    'plugin:import/recommended',                               // Import/export best practices
    'plugin:import/typescript',                                // TypeScript-specific import rules
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    // Include all TypeScript configuration files
    project: ['./tsconfig.json', './tsconfig.test.json', './tsconfig.node.json'],
    ecmaFeatures: {
      jsx: true,
    },
    tsconfigRootDir: __dirname,
  },
  // Required plugins for our rule sets
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
    'jsx-a11y',
    'testing-library',
    'import'
  ],
  settings: {
    react: {
      version: 'detect', // Automatically detect React version
    },
    'import/resolver': {
      typescript: {
        // Configure import resolution for TypeScript
        project: ['./tsconfig.json', './tsconfig.test.json', './tsconfig.node.json'],
        alwaysTryTypes: true,
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/internal-regex': '^@/', // Mark @/ imports as internal
  },
  rules: {
    // React Rules
    'react/react-in-jsx-scope': 'off',      // Modern React doesn't need React imports
    'react/prop-types': 'off',              // Using TypeScript instead of PropTypes
    'react/jsx-uses-react': 'off',          // Modern React doesn't need React imports
    'react/jsx-handler-names': ['error', {  // Enforce consistent event handler naming
      eventHandlerPrefix: 'handle',         // Functions that handle events should start with 'handle'
      eventHandlerPropPrefix: 'on',         // Props that accept handlers should start with 'on'
      checkLocalVariables: true,            // Apply to local variables too
    }],
    'react/jsx-key': ['error', {           // Prevent missing key props in iterators
      checkFragmentShorthand: true,        // Check fragment shorthand syntax too
      checkKeyMustBeforeSpread: true,      // Key should come before spread props
      warnOnDuplicates: true,              // Warn about duplicate keys
    }],
    'react/function-component-definition': ['error', {  // Enforce consistent component definitions
      namedComponents: 'function-declaration',          // Use function declarations for named components
      unnamedComponents: 'arrow-function',              // Use arrow functions for anonymous components
    }],
    'react/jsx-no-useless-fragment': 'error',          // Prevent unnecessary fragments
    'react/jsx-pascal-case': 'error',                  // Components must be PascalCase

    // TypeScript Rules
    '@typescript-eslint/explicit-module-boundary-types': 'error',  // Require return types on exports
    '@typescript-eslint/no-unused-vars': ['error', {              // Prevent unused variables
      argsIgnorePattern: '^_[a-zA-Z][a-zA-Z0-9]*$',             // Allow unused params with meaningful names
      caughtErrorsIgnorePattern: '^_error$',                     // Allow _error in catch clauses
    }],
    '@typescript-eslint/no-explicit-any': 'error',               // Forbid explicit any
    '@typescript-eslint/consistent-type-imports': ['error', {    // Enforce consistent type imports
      prefer: 'type-imports',                                    // Use import type syntax
      fixStyle: 'inline-type-imports',                          // Prefer inline type imports
      disallowTypeAnnotations: true,                            // Forbid type annotations in imports
    }],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'], // Prefer interfaces over types
    '@typescript-eslint/no-misused-promises': [                 // Prevent promise misuse
      'error',
      {
        checksVoidReturn: true,                                // Check void returns
        checksConditionals: true,                             // Check conditionals
        checksSpreads: true,                                 // Check spreads
      },
    ],
    '@typescript-eslint/no-floating-promises': 'error',        // Require promise handling
    '@typescript-eslint/require-await': 'error',              // Prevent async without await
    '@typescript-eslint/no-unsafe-assignment': 'error',       // Prevent unsafe assignments
    '@typescript-eslint/no-unsafe-member-access': 'error',    // Prevent unsafe member access
    '@typescript-eslint/no-unsafe-call': 'error',            // Prevent unsafe function calls
    '@typescript-eslint/no-unsafe-return': 'error',          // Prevent unsafe returns
    '@typescript-eslint/no-unsafe-argument': 'error',        // Prevent unsafe arguments
    '@typescript-eslint/unbound-method': 'error',           // Prevent unbound method references
    '@typescript-eslint/no-unnecessary-type-assertion': 'error', // Prevent redundant type assertions
    '@typescript-eslint/no-redundant-type-constituents': 'error', // Prevent redundant union/intersection members
    '@typescript-eslint/strict-boolean-expressions': ['error', { // Enforce strict boolean expressions
      allowString: false,                                    // Don't allow string coercion
      allowNumber: false,                                   // Don't allow number coercion
      allowNullableObject: false,                          // Don't allow nullable object coercion
      allowNullableBoolean: false,                        // Don't allow nullable boolean coercion
      allowNullableString: false,                        // Don't allow nullable string coercion
      allowNullableNumber: false,                       // Don't allow nullable number coercion
      allowAny: false,                                 // Don't allow any coercion
    }],
    '@typescript-eslint/no-unnecessary-condition': 'error',  // Prevent unnecessary conditions
    '@typescript-eslint/naming-convention': [               // Enforce naming conventions
      'error',
      {
        selector: 'default',
        format: ['camelCase'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],              // Allow PascalCase for React components
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],                          // Types must be PascalCase
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],                         // Enum members must be UPPER_CASE
      },
      {
        selector: 'parameter',
        format: ['camelCase'],                         // Parameters must be camelCase
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'property',
        format: ['camelCase', 'UPPER_CASE'],          // Properties can be camelCase or UPPER_CASE
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
    ],

    // Import Rules
    'import/order': [                                // Enforce import order
      'error',
      {
        groups: [                                   // Group imports by type
          'builtin',                               // Node.js builtins
          'external',                              // npm packages
          'internal',                              // Internal modules
          'parent',                                // Parent directories
          'sibling',                               // Same directory
          'index',                                 // Index files
          'object',                                // Object imports
          'type'                                   // Type imports
        ],
        pathGroups: [                              // Special import groups
          {
            pattern: 'react',                      // React comes first
            group: 'builtin',
            position: 'before'
          },
          {
            pattern: '@preact/**',                 // Preact after external
            group: 'external',
            position: 'after'
          },
          {
            pattern: '@tanstack/**',               // Tanstack after external
            group: 'external',
            position: 'after'
          },
          {
            pattern: '@testing-library/**',        // Testing library after external
            group: 'external',
            position: 'after'
          },
          {
            pattern: '@/**',                       // Internal modules
            group: 'internal',
            position: 'before'
          }
        ],
        pathGroupsExcludedImportTypes: ['react', '@preact/**'],
        'newlines-between': 'always',              // Require newlines between groups
        alphabetize: {                             // Sort imports alphabetically
          order: 'asc',
          caseInsensitive: true
        }
      }
    ],
    'import/no-duplicates': 'error',              // Prevent duplicate imports
    'import/no-default-export': 'error',          // Prefer named exports
    'import/no-cycle': ['error', {                // Prevent circular dependencies
      maxDepth: 1,
      ignoreExternal: true
    }],
    'import/no-unresolved': 'error',              // Ensure imports can be resolved
    'import/first': 'error',                      // Imports must come first
    'import/exports-last': 'error',               // Exports must come last
    'import/no-mutable-exports': 'error',         // Prevent mutable exports

    // React Hooks Rules
    'react-hooks/rules-of-hooks': 'error',        // Enforce Rules of Hooks
    'react-hooks/exhaustive-deps': 'error',       // Enforce exhaustive deps

    // Accessibility Rules
    'jsx-a11y/anchor-is-valid': 'error',         // Ensure anchors are valid
    'jsx-a11y/media-has-caption': 'error',       // Require media captions
    'jsx-a11y/click-events-have-key-events': 'error', // Require keyboard events
    'jsx-a11y/no-noninteractive-element-interactions': 'error', // Prevent misuse of non-interactive elements

    // General Rules
    'consistent-return': 'error',                // Require consistent return values
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn', // No console in production
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn', // No debugger in production
  },
  overrides: [
    // Test Files - More permissive rules for tests
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
        '@typescript-eslint/no-explicit-any': 'off',           // Allow any in tests
        '@typescript-eslint/no-non-null-assertion': 'off',     // Allow non-null assertions in tests
        '@typescript-eslint/no-unsafe-assignment': 'off',      // Allow unsafe assignments in tests
        '@typescript-eslint/no-unsafe-member-access': 'off',   // Allow unsafe member access in tests
        '@typescript-eslint/no-unsafe-call': 'off',           // Allow unsafe calls in tests
        '@typescript-eslint/no-unsafe-return': 'off',         // Allow unsafe returns in tests
        '@typescript-eslint/no-unsafe-argument': 'off',       // Allow unsafe arguments in tests
        'testing-library/no-unnecessary-act': 'error',        // Prevent unnecessary act()
        'testing-library/prefer-screen-queries': 'error',     // Prefer screen queries
        'testing-library/no-wait-for-multiple-assertions': 'error', // One assertion per wait
        'testing-library/no-render-in-setup': 'off',         // Allow render in setup
        'testing-library/no-node-access': 'error',          // Prefer queries over DOM access
        'testing-library/render-result-naming-convention': 'error', // Consistent render result naming
        'testing-library/no-debugging-utils': process.env.CI ? 'error' : 'warn', // No debug in CI
      },
    },
    // TypeScript Declaration Files - Special rules for .d.ts files
    {
      files: ['*.d.ts', 'src/**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',           // Allow any in declarations
        '@typescript-eslint/no-unused-vars': 'off',           // Allow unused vars in declarations
        'import/no-duplicates': 'off',                       // Allow duplicate imports in declarations
        '@typescript-eslint/consistent-type-definitions': 'off', // Allow both types and interfaces
        'import/no-cycle': 'off',                           // Allow cycles in declarations
        '@typescript-eslint/consistent-type-imports': 'off', // Allow inconsistent imports in declarations
        '@typescript-eslint/ban-types': 'off',             // Allow banned types in declarations
        '@typescript-eslint/naming-convention': 'off',     // Allow any naming in declarations
      },
    },
    // Configuration Files - Special rules for config files
    {
      files: [
        '*.config.ts',
        '*.config.js',
        'vite.config.ts',
        'vitest.config.ts',
        'scripts/**/*',
      ],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',    // Allow require in configs
        'import/no-default-export': 'off',             // Allow default exports in configs
        'no-console': 'off',                          // Allow console in configs
      },
    },
  ],
};
