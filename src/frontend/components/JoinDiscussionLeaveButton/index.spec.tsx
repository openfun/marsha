import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { PLAYER_ROUTE } from 'components/routes';
import { modelName } from 'types/models';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';
import * as mockWindow from 'utils/window';
import { JoinDiscussionLeaveButton } from '.';

jest.mock('utils/window', () => ({
  converse: {
    participantLeaves: jest.fn(),
  },
}));

describe('<JoinDiscussionLeaveButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('renders the leave button', () => {
    render(wrapInIntlProvider(wrapInRouter(<JoinDiscussionLeaveButton />)));

    screen.getByRole('button', { name: 'Leave the discussion' });
  });

  it('clicks on the leave button and is redirected to the player', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(<JoinDiscussionLeaveButton />, [
          {
            path: PLAYER_ROUTE(modelName.VIDEOS),
            element: <span>{'video player'}</span>,
          },
        ]),
      ),
    );

    const leaveButton = screen.getByRole('button', {
      name: 'Leave the discussion',
    });

    fireEvent.click(leaveButton);

    screen.getByText('video player');
    expect(mockWindow.converse.participantLeaves).toHaveBeenCalled();
  });
});
