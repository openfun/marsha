module.exports = {
  moduleDirectories: [__dirname, 'node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'css'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
    'is-reference': '<rootDir>/node_modules/is-reference/src/index.js',
    'estree-walker': '<rootDir>/node_modules/estree-walker/src/index.js',
    '@lib-video/(.*)': '<rootDir>/src/$1',
    '@lib-components/(.*)': '<rootDir>/../lib_components/src/$1',
  },
  reporters: [
    'default',
    'jest-image-snapshot/src/outdated-snapshot-reporter.js',
  ],
  resolver: `${__dirname}/../../resolver.js`,
  setupFilesAfterEnv: [
    'core-js',
    'regenerator-runtime/runtime',
    './testSetup.ts',
  ],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'https://localhost',
  },
  testMatch: [__dirname + '/**/*.spec.+(ts|tsx|js)'],
};
