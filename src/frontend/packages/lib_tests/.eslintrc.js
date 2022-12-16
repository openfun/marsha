module.exports = {
  extends: '../../.eslintrc-root.js',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  rules: {
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
        },
      },
    ],
    '@typescript-eslint/no-empty-function': 'off',
  },
};
