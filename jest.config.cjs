const path = require('path');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'ts-jest/presets/default-esm', // Use ESM preset

  // Module resolution and mapping
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@octokit/rest$': '<rootDir>/src/__mocks__/@octokit/rest.ts',
    '^@octokit/app$': '<rootDir>/src/__mocks__/@octokit/app.ts',
    '^@octokit/core$': '<rootDir>/src/__mocks__/@octokit/core.ts'
  },

  // Custom resolver for mixed module systems
  resolver: '<rootDir>/moduleResolver.cjs',

  // Transformation settings
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        baseUrl: '.',
        paths: {
          'src/*': ['src/*']
        }
      },
      useESM: true // Enable ESM support
    }]
  },

  // Transform node_modules that use ESM
  transformIgnorePatterns: [
    'node_modules/(?!(@preact|@testing-library|@octokit)/)'
  ],

  // Test file matching
  testMatch: [
    '**/__tests__/**/*.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)'
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest-setup.ts'
  ],

  // Module file extensions
  moduleFileExtensions: [
    'ts', 'tsx', 'js', 'jsx', 'json', 'node', 'cjs', 'mjs'
  ],

  // Test environment options
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost'
  },

  // Module resolution settings
  moduleDirectories: ['node_modules', '.', '<rootDir>/src'],
  roots: ['<rootDir>', '<rootDir>/src'],

  // Enable ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Global settings
  globals: {
    'ts-jest': {
      useESM: true,
      isolatedModules: true,
      tsconfig: {
        baseUrl: '.',
        paths: {
          'src/*': ['src/*']
        }
      }
    }
  },

  // Verbose logging for debugging
  verbose: true
};
