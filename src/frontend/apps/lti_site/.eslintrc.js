module.exports = {
  root: true,
  extends: ['marsha'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'import/order': [
          'error',
          {
            alphabetize: {
              order: 'asc',
            },
            groups: [
              'builtin',
              'external',
              'internal',
              'parent',
              'sibling',
              'index',
            ],
            pathGroups: [
              {
                pattern:
                  '+(__mock__|apps|components|data|i18n|scss|translations|types|utils)/**',
                group: 'internal',
              },
            ],
            pathGroupsExcludedImportTypes: ['builtin'],
            'newlines-between': 'always',
          },
        ],
      },
    },
  ],
  ignorePatterns: ['node_modules/', '.eslintrc.js'],
};
