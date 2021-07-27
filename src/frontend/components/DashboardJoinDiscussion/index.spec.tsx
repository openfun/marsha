import { act, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';

import { useJoinParticipant } from '../../data/stores/useJoinParticipant';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { DashboardJoinDiscussion } from '.';

jest.mock('../../utils/window', () => ({
  converse: {
    acceptParticipantToMount: jest.fn(),
    kickParticipant: jest.fn(),
    rejectParticipantToMount: jest.fn(),
  },
}));

describe('<DashboardJoinDiscussion />', () => {
  it('renders the components and updates the participant list', () => {
    const participant1 = {
      id: 'participant1',
      name: 'John Doe',
    };
    const participant2 = {
      id: 'participant2',
      name: 'Jane Doe',
    };

    useJoinParticipant.getState().addParticipantAskingToJoin(participant1);

    render(wrapInIntlProvider(<DashboardJoinDiscussion />));

    // participant 1 is in the waiting state
    const askParticipant1 = screen.getByTestId('ask-participant1');
    within(askParticipant1).getByText('John Doe');
    within(askParticipant1).getByRole('button', { name: 'accept' });
    const rejectJohnDoe = within(askParticipant1).getByRole('button', {
      name: 'reject',
    });

    // reject the request
    fireEvent.click(rejectJohnDoe);

    // nobody is in the waiting state
    expect(screen.queryByTestId('ask-participant1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ask-participant2')).not.toBeInTheDocument();

    act(() => {
      // add participant 2 to the waiting list
      useJoinParticipant.getState().addParticipantAskingToJoin(participant2);
    });

    const askParticipant2 = screen.getByTestId('ask-participant2');
    within(askParticipant2).getByText('Jane Doe');
    const acceptParticipant2 = within(askParticipant2).getByRole('button', {
      name: 'accept',
    });
    within(askParticipant1).getByRole('button', { name: 'reject' });

    // nobody is in the discussion
    expect(screen.queryByTestId('in-participant1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('in-participant2')).not.toBeInTheDocument();

    // accept the participant 2
    fireEvent.click(acceptParticipant2);

    // participant 2 is in the discussion
    const inParticipant2 = screen.getByTestId('in-participant2');

    const kickButton = within(inParticipant2).getByRole('button', {
      name: 'kick off participant',
    });

    // kick off participant 2
    fireEvent.click(kickButton);

    // nobody in the waiting list nor in the discussion
    expect(screen.queryByTestId('ask-participant1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ask-participant2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('in-participant1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('in-participant2')).not.toBeInTheDocument();
  });
});
