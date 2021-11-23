import { render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { StudentShowViewersButton } from '.';

describe('<StudentShowViewersButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the viewers button', () => {
    render(wrapInIntlProvider(wrapInRouter(<StudentShowViewersButton />)));

    screen.getByRole('button', { name: 'Show viewers' });
  });
});
