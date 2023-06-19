import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { LiveFeedbackProvider } from '@lib-video/hooks/useLiveFeedback';

import { LiveFeedbackWrapper } from '.';

describe('<LiveFeedbackWrapper />', () => {
  it('renders actions and switch on click', async () => {
    render(
      <LiveFeedbackProvider value={false}>
        <LiveFeedbackWrapper />
      </LiveFeedbackProvider>,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Show live feedback' }),
    );

    const hideButton = await screen.findByRole('button', {
      name: 'Hide live feedback',
    });
    await userEvent.click(hideButton);

    expect(
      await screen.findByRole('button', { name: 'Show live feedback' }),
    ).toBeInTheDocument();
  });
});
