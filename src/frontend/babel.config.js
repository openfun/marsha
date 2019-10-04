module.exports = {
  plugins: [
    [
      'react-intl',
      {
        messagesDir: './i18n',
      },
    ],
    '@babel/proposal-class-properties',
    '@babel/plugin-syntax-dynamic-import',
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        forceAllTransforms: true,
        useBuiltIns: 'usage',
        corejs: 3,
        targets: 'last 1 version, >0.2%, IE 11',
      },
    ],
    '@babel/preset-typescript',
    'react',
  ],
};
