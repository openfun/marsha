import { render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { StudentShowChatButton } from '.';

describe('<StudentShowChatButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the chat button', () => {
    render(wrapInIntlProvider(wrapInRouter(<StudentShowChatButton />)));

    screen.getByRole('button', { name: 'Show/Hide Chat' });
  });
});
