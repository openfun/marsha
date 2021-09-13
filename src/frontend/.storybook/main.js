const path = require('path');

module.exports = {
  stories: ['../components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    {
      name: '@storybook/addon-essentials',
      options: {
        docs: false,
      },
    },
  ],
  webpackFinal: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      modules: [path.resolve(__dirname, '..'), 'node_modules'],
    },
  }),
};
