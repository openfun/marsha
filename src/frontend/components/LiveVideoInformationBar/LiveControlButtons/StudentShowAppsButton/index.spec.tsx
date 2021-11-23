import { render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { StudentShowAppsButton } from '.';

describe('<StudentShowAppsButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the Apps button', () => {
    render(wrapInIntlProvider(wrapInRouter(<StudentShowAppsButton />)));

    screen.getByRole('button', { name: 'Apps' });
  });
});
