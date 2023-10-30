const { libModuleNameMapper } = require('marsha-config');

module.exports = {
  moduleDirectories: [__dirname, 'node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'css'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
    ...libModuleNameMapper['lib-classroom'],
  },
  reporters: ['default'],
  resolver: 'marsha-config/jest/resolver.js',
  setupFilesAfterEnv: [
    'core-js',
    'regenerator-runtime/runtime',
    'marsha-config/jest/testSetup.js',
  ],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'https://localhost',
  },
  testMatch: [__dirname + '/**/*.spec.+(ts|tsx|js)'],
};
