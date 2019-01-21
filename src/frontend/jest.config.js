module.exports = {
  globals: {
    'ts-jest': {
      babelConfig: require('./babel.config.js'),
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'css'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
  },
  testMatch: [__dirname + '/**/*.spec.+(ts|tsx|js)'],
  testURL: 'https://localhost',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
