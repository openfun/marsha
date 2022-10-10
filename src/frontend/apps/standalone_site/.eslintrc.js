module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
    'react-app/jest',
  ],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    ecmaFeatures: {
      jsx: true,
    },
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  plugins: ['import', 'react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-floating-promises': 0,
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
    'array-callback-return': 'error',
    'block-scoped-var': 'error',
    'react/jsx-curly-brace-presence': [
      'error',
      { props: 'never', children: 'never', propElementValues: 'always' },
    ],
    curly: 2,
    'default-case': 'error',
    eqeqeq: 2,
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
              '+(features|components|utils|routes|styles|assets|conf)/**',
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
    'no-alert': 1,
    'react/jsx-uses-react': 0,
    'react/prop-types': 0,
    'react/react-in-jsx-scope': 0,
    'react/jsx-fragments': ['error', 'element'],
  },
  ignorePatterns: ['node_modules/', '.eslintrc.js', 'src/setupProxy.js'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.spec.*'],

      rules: {
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/no-non-null-assertion': 0,
        '@typescript-eslint/no-unsafe-assignment': 0,
        '@typescript-eslint/no-unsafe-return': 0,
        'react/display-name': 0,
      },
    },
  ],
};
