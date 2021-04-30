import React from 'react';
import { MINIMAL_VIEWPORTS } from '@storybook/addon-viewport';
import { wrapInIntlProvider } from '../utils/tests/intl';
import { Grommet } from 'grommet';
import { theme } from '../utils/theme/theme';
import { GlobalStyles } from '../utils/theme/baseStyles';

const customViewports = {
  moodleIframe: {
    name: 'moodle iframe',
    styles: {
      width: '766px',
      height: '584px',
    },
  },
};

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  viewport: {
    viewports: {
      ...MINIMAL_VIEWPORTS,
      ...customViewports,
    },
  },
};

export const decorators = [
  (Story) =>
    wrapInIntlProvider(
      <Grommet theme={theme} style={{ height: '100%' }}>
        <Story />
        <GlobalStyles />
      </Grommet>,
    ),
];
