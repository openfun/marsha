const { appModuleNameMapper } = require('marsha-config');

module.exports = {
  moduleDirectories: [__dirname, 'node_modules', '../../node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'css'],
  moduleNameMapper: {
    ...appModuleNameMapper['website'],
    'react-markdown': '<rootDir>/src/__mock__/react-markdown.tsx',
    '@tanstack/react-query-devtools':
      '<rootDir>/src/__mock__/@tanstack/react-query-devtools.tsx',
    '\\.(png|jpg)$': 'marsha-config/jest/mocks/assetMock.js',
    '\\.css$': 'identity-obj-proxy',
  },
  reporters: ['default'],
  resolver: 'marsha-config/jest/resolver.js',
  setupFilesAfterEnv: [
    'marsha-config/jest/testSetup.js',
    '<rootDir>/testSetup.js',
  ],
  testEnvironment: 'jsdom',
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
