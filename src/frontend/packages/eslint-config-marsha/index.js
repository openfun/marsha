module.exports = {
  extends: ['plugin:react/recommended', 'plugin:prettier/recommended', "plugin:@tanstack/eslint-plugin-query/recommended"],
  parserOptions: {
    ecmaVersion: "latest", // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['import', 'react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'array-callback-return': 'error',
    'block-scoped-var': 'error',
    'react/jsx-curly-brace-presence': [
      'error',
      { props: 'never', children: 'never', propElementValues: 'always' },
    ],
    curly: 'error',
    'default-case': 'error',
    eqeqeq: 'error',
    'import/no-duplicates': ['error', { considerQueryString: false }],
    'no-alert': 'error',
    'react/jsx-uses-react': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-fragments': ['error', 'element'],
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: ['function-expression', 'arrow-function'],
      },
    ],
  },
  ignorePatterns: ['node_modules/', '.eslintrc.js'],
  settings: {
    react: {
      version: 'detect',
    },
    jest: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      parser: '@typescript-eslint/parser', // Specifies the ESLint parser
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-unsafe-enum-comparison': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
        ],
        'sort-imports': [
          'error',
          {
            ignoreDeclarationSort: true,
          },
        ],
      },
    },
    {
      files: ['*.spec.*', '*.test.*', '**/__mock__/**/*'],
      plugins: ['jest'],
      extends: ['plugin:jest/recommended', 'plugin:testing-library/react'],
      rules: {
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        'testing-library/no-await-sync-events': [
          'error',
          { eventModules: ['fire-event'] },
        ],
        'testing-library/await-async-events': [
          'error',
          {
            eventModule: "userEvent"
          }
        ],
        'testing-library/no-manual-cleanup': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
        ],
        'react/display-name': 0,
        'jest/expect-expect': 'error',
        '@typescript-eslint/unbound-method': 'off',
        'jest/unbound-method': 'error',
      },
    },
    {
      files: ['*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 0,
      },
    },
  ],
};
