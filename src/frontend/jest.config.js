module.exports = {
  moduleDirectories: [__dirname, 'node_modules'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'css'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
  },
  setupFilesAfterEnv: [
    'core-js',
    'regenerator-runtime/runtime',
    './testSetup.ts',
  ],
  testEnvironment: 'jsdom',
  testMatch: [__dirname + '/**/*.spec.+(ts|tsx|js)'],
  testURL: 'https://localhost',
};
