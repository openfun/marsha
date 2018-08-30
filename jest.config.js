module.exports = {
  globals: {
    'ts-jest': {
      useBabelrc: true,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'css'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/front/__mocks__/styleMock.js',
  },
  testMatch: [__dirname + '/front/**/*.spec.+(ts|tsx|js)'],
  testURL: 'https://localhost',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
