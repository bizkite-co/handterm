module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error', // Changed from 'warn' to 'error'
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-console': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'no-incomplete-useState-destructuring': 'off',
    'no-misleading-character-class': 'error',
    '@typescript-eslint/ban-ts-comment': 'warn', // Allow @ts-ignore with a warning
    'prefer-const': 'warn'
  },
  overrides: [
    {
      // More lenient rules for utility files and test files
      files: ['**/utils/**/*.ts', '**/__tests__/**/*.ts', '**/__tests__/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': 'off'
      }
    }
  ]
};
