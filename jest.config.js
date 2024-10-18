
export default {
  preset: 'ts-jest',
  injectGlobals: true,
  testEnvironment: 'jest-environment-jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories:['node_modules', 'src'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
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
