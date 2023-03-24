import { fireEvent, screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { useParticipantWorkflow } from '@lib-video/hooks/useParticipantWorkflow';
import * as mockWindow from '@lib-video/utils/window';

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

    expect(
      screen.getByRole('button', { name: 'Leave discussion' }),
    ).toBeInTheDocument();
  });

  it('clicks on the leave button and is redirected to the player', () => {
    const mockRest = jest.fn();
    useParticipantWorkflow.setState({
      reset: mockRest,
    });

    render(<StudentLeaveDiscussionButton />);

    const leaveButton = screen.getByRole('button', {
      name: 'Leave discussion',
    });

    fireEvent.click(leaveButton);

    expect(mockRest).toHaveBeenCalled();
    expect(mockRest).toHaveBeenCalledTimes(1);
    expect(mockWindow.converse.participantLeaves).toHaveBeenCalled();
  });
});
