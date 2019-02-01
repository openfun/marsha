module.exports = {
  plugins: [
    [
      'react-intl',
      {
        messagesDir: './i18n',
      },
    ],
    '@babel/proposal-class-properties',
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        forceAllTransforms: true,
        useBuiltIns: 'usage',
      },
    ],
    '@babel/preset-typescript',
    'react',
  ],
};
