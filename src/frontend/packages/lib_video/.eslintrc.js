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
            pattern: '+(api|components|hooks|types|utils|conf|errors)/**',
            group: 'internal',
          },
          {
            pattern: 'errors',
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
};
