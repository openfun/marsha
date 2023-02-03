module.exports = {
  moduleDirectories: [__dirname, 'node_modules', '../../node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'css'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
    'is-reference':
      '<rootDir>/../../node_modules/is-reference/dist/is-reference.js',
    'estree-walker': '<rootDir>../../node_modules/estree-walker/src/index.js',
  },
  reporters: [
    'default',
    'jest-image-snapshot/src/outdated-snapshot-reporter.js',
  ],
  resolver: `${__dirname}/../../resolver.js`,
  setupFilesAfterEnv: [
    'core-js',
    'regenerator-runtime/runtime',
    './testSetup.ts',
  ],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'https://localhost',
  },
  testMatch: [__dirname + '/**/*.spec.+(ts|tsx|js)'],
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
      'khroma' +
      ')/)',
  ],
};
