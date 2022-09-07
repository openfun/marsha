import { fireEvent, screen } from '@testing-library/react';
import React from 'react';

import { PLAYER_ROUTE } from 'components/routes';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { modelName } from 'types/models';
import * as mockWindow from 'utils/window';
import render from 'utils/tests/render';

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
    render(<StudentLeaveDiscussionButton />);

    screen.getByRole('button', { name: 'Leave discussion' });
  });

  it('clicks on the leave button and is redirected to the player', () => {
    const mockRest = jest.fn();
    useParticipantWorkflow.setState({
      reset: mockRest,
    });

    render(<StudentLeaveDiscussionButton />, {
      routerOptions: {
        routes: [
          {
            path: PLAYER_ROUTE(modelName.VIDEOS),
            render: () => {
              return <span>{'video player'}</span>;
            },
          },
        ],
      },
    });

    const leaveButton = screen.getByRole('button', {
      name: 'Leave discussion',
    });

    fireEvent.click(leaveButton);

    expect(mockRest).toHaveBeenCalled();
    expect(mockRest).toHaveBeenCalledTimes(1);
    expect(mockWindow.converse.participantLeaves).toHaveBeenCalled();
  });
});
