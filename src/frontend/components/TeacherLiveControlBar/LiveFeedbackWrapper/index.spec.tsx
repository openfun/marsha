import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { LiveFeedbackProvider } from 'data/stores/useLiveFeedback';
import render from 'utils/tests/render';

import { LiveFeedbackWrapper } from '.';

describe('<LiveFeedbackWrapper />', () => {
  it('renders actions and switch on click', async () => {
    render(
      <LiveFeedbackProvider value={false}>
        <LiveFeedbackWrapper />
      </LiveFeedbackProvider>,
    );

    userEvent.click(screen.getByRole('button', { name: 'Show live feedback' }));

    const hideButton = await screen.findByRole('button', {
      name: 'Hide live feedback',
    });
    userEvent.click(hideButton);

    await screen.findByRole('button', { name: 'Show live feedback' });
  });
});
