import { render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { StudentViewDocumentButton } from '.';

describe('<StudentViewDocumentButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the share button', () => {
    render(wrapInIntlProvider(wrapInRouter(<StudentViewDocumentButton />)));

    screen.getByRole('button', { name: 'Document' });
  });
});
