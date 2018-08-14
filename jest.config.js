module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testMatch: [__dirname + '/front/**/*.spec.+(ts|tsx|js)'],
  testURL: 'https://localhost',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
