module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testMatch: ['**/*.spec.+(ts|tsx|js)'],
  testURL: 'https://localhost',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
