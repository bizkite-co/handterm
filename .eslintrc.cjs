// Linting docs are in ./docs/linting/_index.md
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    'vitest-globals/env': true,
  },
  globals: {
    Buffer: 'readonly',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:vitest-globals/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    exclude: ['eslint-plugin-custom-rules/**'],
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    tsconfigRootDir: __dirname,
  },
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
    'jsx-a11y',
    'testing-library',
    'import',
    'vitest-globals',
    'custom-rules'
  ],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        project: [
          './tsconfig.json',
          './tsconfig.test.json',
          './tsconfig.node.json',
        ],
        alwaysTryTypes: true,
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/internal-regex': '^src/',
  },
  rules: {
    // Existing TypeScript Rules
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_[a-zA-Z][a-zA-Z0-9]*$',
      caughtErrorsIgnorePattern: '^_error$',
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports',
      fixStyle: 'inline-type-imports',
      disallowTypeAnnotations: true,
    }],

    // Type Safety Strategies
    '@typescript-eslint/strict-boolean-expressions': ['warn', {
      allowString: false,
      allowNumber: false,
      allowNullableObject: false,
      allowNullableBoolean: false,
      allowNullableString: false,
      allowNullableNumber: false,
      allowAny: false
    }],

    // Functional Programming Encouragement (without plugin)
    'no-var': 'error',
    'prefer-const': 'warn',
    'no-param-reassign': 'warn',

    // Custom Type Guard Encouragement
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'IfStatement[test.type="BinaryExpression"][test.operator="!=="]',
        message: 'Consider using type guards for more explicit type checking. Refer to docs/linting/type_safety_strategies.md'
      }
    ]
  },
  overrides: [
    // Test Files Override
    {
      files: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/__tests__/**/*.[jt]s?(x)',
        'e2e/**/*.[jt]s?(x)',
        'tests/**/*.[jt]s?(x)',
        'src/test-utils/**/*',
        'vitest-setup.ts',
      ],
      parserOptions: {
        project: './tsconfig.eslint-test.json'
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-param-reassign': 'off',
        'no-restricted-globals': [
          'error',
          {
            name: 'ImageData',
            message: 'Import ImageData from the canvas package instead of using the global browser API'
          }
        ]
      }
    },
    // Type Declaration Files Override
    {
      files: [
        'src/test-utils/**/*.d.ts',
        'src/hooks/useActivityMediator.d.ts'
      ],
      parserOptions: {
        project: './tsconfig.eslint-canvas.json'
      }
    }
  ]
};
