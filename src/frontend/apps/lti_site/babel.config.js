module.exports = {
  plugins: [
    [
      'react-intl',
      {
        extractFromFormatMessageCall: true,
        idInterpolationPattern: '[sha512:contenthash:base64:6]',
        ast: true,
      },
    ],
    '@babel/proposal-class-properties',
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
};
