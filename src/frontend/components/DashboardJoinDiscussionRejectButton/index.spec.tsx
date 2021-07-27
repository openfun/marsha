import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { useJoinParticipant } from '../../data/stores/useJoinParticipant';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import * as mockWindow from '../../utils/window';
import { DashboardJoinDiscussionRejectButton } from '.';

jest.mock('../../utils/window', () => ({
  converse: {
    rejectParticipantToMount: jest.fn(),
  },
}));

describe('<DashboardJoinDiscussionRejectButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('renders the button and click on it', () => {
    const participant = {
      id: 'participant1',
      name: 'John Doe',
    };
    // add participant in discussion
    useJoinParticipant.getState().addParticipantAskingToJoin(participant);

    render(
      wrapInIntlProvider(
        <DashboardJoinDiscussionRejectButton participant={participant} />,
      ),
    );

    const rejectButton = screen.getByRole('button', { name: 'reject' });

    fireEvent.click(rejectButton);

    expect(
      useJoinParticipant.getState().participantsAskingToJoin,
    ).not.toContain(participant);
    expect(mockWindow.converse.rejectParticipantToMount).toHaveBeenCalledWith(
      participant,
    );
  });
});
