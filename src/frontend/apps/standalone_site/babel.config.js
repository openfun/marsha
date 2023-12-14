'use strict';

const babelJest = require('babel-jest').default;

module.exports = babelJest.createTransformer({
  plugins: [
    [
      'react-intl',
      {
        extractFromFormatMessageCall: true,
        idInterpolationPattern: '[sha512:contenthash:base64:6]',
        ast: true,
      },
    ],
    'babel-plugin-import-remove-resource-query',
    '@babel/plugin-syntax-dynamic-import',
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        corejs: 3,
        forceAllTransforms: true,
        targets: 'last 1 version, >0.2%, not IE <= 11',
        useBuiltIns: 'entry',
      },
    ],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  babelrc: false,
  configFile: false,
});
