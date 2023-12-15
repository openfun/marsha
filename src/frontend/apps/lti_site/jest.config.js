const { appModuleNameMapper } = require('marsha-config');

module.exports = {
  moduleDirectories: [__dirname, 'node_modules', '../../node_modules'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'css'],
  moduleNameMapper: {
    '\\.(css|svg)$': '<rootDir>/__mocks__/styleMock.js',
    'is-reference': '<rootDir>/../../node_modules/is-reference/src/index.js',
    'estree-walker': '<rootDir>/../../node_modules/estree-walker/src/index.js',
    ...appModuleNameMapper['lti'],
  },
  reporters: ['default'],
  resolver: 'marsha-config/jest/resolver.js',
  setupFilesAfterEnv: [
    'core-js',
    'regenerator-runtime/runtime',
    'marsha-config/jest/testSetup.js',
  ],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'https://localhost',
  },
  testMatch: [__dirname + '/**/*.spec.+(ts|tsx|js)'],
  testPathIgnorePatterns: ['/apps/.cookiecutter/'],
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'trim-lines|' +
      '@mdx-js/mdx2|' +
      'unified|' +
      'bail|' +
      'is-plain-obj|' +
      'trough|' +
      'vfile[^/]*|' +
      'unist-util-stringify-position|' +
      'remark-mdx|' +
      'micromark[^/]*|' +
      'unist-util-position-from-estree|' +
      'estree-util[^/]+|' +
      'estree-walker|' +
      'decode-named-character-reference|' +
      'character-entities|' +
      'mdast-util[^/]+|' +
      'ccount|' +
      'parse-entities|' +
      'character-entities-legacy|' +
      'character-reference-invalid|' +
      'is-decimal|' +
      'is-hexadecimal|' +
      'is-alphanumerical|' +
      'is-alphabetical|' +
      'stringify-entities|' +
      'character-entities-html4|' +
      'remark[^/]+|' +
      'unist-builder|' +
      'unist-util[^/]+|' +
      'periscopic|' +
      'is-reference|' +
      'hast-util[^/]+|' +
      'hast-to-hyperscript+|' +
      'html-void-elements+|' +
      'comma-separated-tokens|' +
      'property-information|' +
      'space-separated-tokens|' +
      'zwitch|' +
      'rehype-[^/]+|' +
      'hastscript|' +
      'web-namespaces|' +
      'longest-streak|' +
      'lowlight|' +
      'fault|' +
      'd3|' +
      'd3-[^/]+|' +
      'internmap|' +
      'delaunator|' +
      'robust-predicates|' +
      'khroma|' +
      'devlop' +
      ')/)',
  ],
};
