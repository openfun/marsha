const path = require('path');

module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'css'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
  },
  setupFilesAfterEnv: [
    'core-js',
    'regenerator-runtime/runtime',
    './testSetup.ts',
  ],
  testMatch: [path.join(__dirname, '/**/*.spec.+(ts|tsx|js)')],
  testURL: 'https://localhost',
};
