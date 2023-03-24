module.exports = {
  extends: '../../.eslintrc-root.js',
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
                  '+(features|components|utils|routes|styles|assets|conf|hooks|api|__mock__)/**',
                group: 'internal',
              },
              {
                pattern: 'routes',
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
  ignorePatterns: ['node_modules/', '.eslintrc.js', 'craco.config.js'],
};
