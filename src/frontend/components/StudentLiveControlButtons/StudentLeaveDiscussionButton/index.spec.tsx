import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { PLAYER_ROUTE } from 'components/routes';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { modelName } from 'types/models';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';
import * as mockWindow from 'utils/window';

import { StudentLeaveDiscussionButton } from '.';

jest.mock('utils/window', () => ({
  converse: {
    participantLeaves: jest.fn(),
  },
}));
jest.mock('components/SVGIcons/JoinDiscussionSVG', () => ({
  JoinDiscussionSVG: () => <span>leave discussion icon</span>,
}));

describe('<StudentLeaveDiscussionButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the leave button', () => {
    render(wrapInIntlProvider(wrapInRouter(<StudentLeaveDiscussionButton />)));

    screen.getByRole('button', { name: 'Leave discussion' });
    screen.getByText('leave discussion icon');
  });

  it('clicks on the leave button and is redirected to the player', () => {
    const mockRest = jest.fn();
    useParticipantWorkflow.setState({
      reset: mockRest,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(<StudentLeaveDiscussionButton />, [
          {
            path: PLAYER_ROUTE(modelName.VIDEOS),
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
    screen.getByText('leave discussion icon');

    fireEvent.click(leaveButton);

    expect(mockRest).toHaveBeenCalled();
    expect(mockRest).toHaveBeenCalledTimes(1);
    screen.getByText('video player');
    expect(mockWindow.converse.participantLeaves).toHaveBeenCalled();
  });
});
