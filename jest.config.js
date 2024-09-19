export default {
  preset: 'ts-jest',
  injectGlobals: true,
  testEnvironment: 'jest-environment-jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        sourceMap: true,
      }
    }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],      
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
