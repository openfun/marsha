module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'css'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
  },
  setupFilesAfterEnv: ['./testSetup.ts'],
  testMatch: [__dirname + '/**/*.spec.+(ts|tsx|js)'],
  testURL: 'https://localhost',
};
