module.exports = {
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.ts?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig-lint.json',
      },
    ],
  },
  testEnvironment: 'node',
};