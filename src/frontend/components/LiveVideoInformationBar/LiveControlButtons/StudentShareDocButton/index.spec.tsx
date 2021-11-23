import { render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { StudentShareDocButton } from '.';

describe('<StudentShareDocButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the share button', () => {
    render(wrapInIntlProvider(wrapInRouter(<StudentShareDocButton />)));

    screen.getByRole('button', { name: 'Upload file' });
  });
});
