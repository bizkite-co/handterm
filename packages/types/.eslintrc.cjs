module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'vitest-globals'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
  },
  overrides: [
    {
      // The default tsconfig.json only covers src/; test files parse under
      // the dedicated eslint-test tsconfig (which also pulls in vitest globals).
      files: ['test/**/*.ts', 'test/**/*.tsx'],
      parserOptions: {
        project: './tsconfig.eslint-test.json',
      },
      env: {
        'vitest-globals/env': true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        // The signal tests exercise a deliberately generic API; unsafe-call
        // checks add no value here.
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
      },
    },
  ]
}