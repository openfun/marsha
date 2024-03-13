module.exports = {
  plugins: [
    [
      'formatjs',
      {
        extractFromFormatMessageCall: true,
        idInterpolationPattern: '[sha512:contenthash:base64:6]',
        ast: true,
      },
    ],
    [
      '@babel/plugin-transform-typescript',
      {
        allowDeclareFields: true,
      },
    ],
    '@babel/proposal-class-properties',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-transform-runtime',
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
    '@babel/preset-typescript',
    'react',
  ],
};
