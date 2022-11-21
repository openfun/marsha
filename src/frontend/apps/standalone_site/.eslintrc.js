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
            pattern:
              '+(features|components|utils|routes|styles|assets|conf|hooks)/**',
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
  ignorePatterns: ['node_modules/', '.eslintrc.js', 'src/setupProxy.js'],
};
