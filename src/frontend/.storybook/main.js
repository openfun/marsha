module.exports = {
  stories: ['../components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-essentials'],

  // workaround for https://github.com/storybookjs/storybook/issues/15067
  // storybook 6.3 should fix it
  typescript: {
    // also valid 'react-docgen-typescript' | false
    reactDocgen: 'react-docgen',
  },
};
