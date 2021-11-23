import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { PLAYER_ROUTE } from 'components/routes';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';
import * as mockWindow from 'utils/window';

import { StudentLeaveDiscussionButton } from '.';

jest.mock('utils/window', () => ({
  converse: {
    participantLeaves: jest.fn(),
  },
}));

describe('<StudentLeaveDiscussionButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the leave button', () => {
    render(wrapInIntlProvider(wrapInRouter(<StudentLeaveDiscussionButton />)));

    screen.getByRole('button', { name: 'Leave discussion' });
  });

  it('clicks on the leave button and is redirected to the player', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(<StudentLeaveDiscussionButton />, [
          {
            path: PLAYER_ROUTE(),
            render: () => {
              return <span>{'video player'}</span>;
            },
          },
        ]),
      ),
    );

    const leaveButton = screen.getByRole('button', {
      name: 'Leave discussion',
    });

    fireEvent.click(leaveButton);

    screen.getByText('video player');
    expect(mockWindow.converse.participantLeaves).toHaveBeenCalled();
  });
});
