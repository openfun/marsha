const { libModuleNameMapper } = require('marsha-config');

module.exports = {
  moduleDirectories: [__dirname, 'node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'css'],
  moduleNameMapper: {
    '\\.(css|svg)$': '<rootDir>/__mocks__/styleMock.js',
    'is-reference': '<rootDir>/../../node_modules/is-reference/src/index.js',
    'estree-walker': '<rootDir>/../../node_modules/estree-walker/src/index.js',
    ...libModuleNameMapper['lib-video'],
  },
  reporters: [
    'default',
    'jest-image-snapshot/src/outdated-snapshot-reporter.js',
  ],
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
