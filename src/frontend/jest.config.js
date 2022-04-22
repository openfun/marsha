module.exports = {
  moduleDirectories: [__dirname, 'node_modules'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'css'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
    'is-reference': '<rootDir>/node_modules/is-reference/src/index.js',
  },
  reporters: [
    'default',
    'jest-image-snapshot/src/outdated-snapshot-reporter.js',
  ],
  setupFilesAfterEnv: [
    'core-js',
    'regenerator-runtime/runtime',
    './testSetup.ts',
  ],
  testEnvironment: 'jsdom',
  testMatch: [__dirname + '/**/*.spec.+(ts|tsx|js)'],
  testURL: 'https://localhost',
  transformIgnorePatterns: [
    '/node_modules/(?!(' +
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
      'robust-predicates' +
      ')/)',
  ],
};
