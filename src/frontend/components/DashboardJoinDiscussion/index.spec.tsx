import { render, screen, within } from '@testing-library/react';
import React from 'react';

import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DashboardJoinDiscussion } from '.';

jest.mock('utils/window', () => ({
  converse: {
    acceptParticipantToJoin: jest.fn(),
    kickParticipant: jest.fn(),
    rejectParticipantToJoin: jest.fn(),
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

    const video = videoMockFactory();

    // participant 1 is in the waiting list
    const { rerender } = render(
      wrapInIntlProvider(
        <DashboardJoinDiscussion
          video={{ ...video, participants_asking_to_join: [participant1] }}
        />,
      ),
    );

    const askParticipant1 = screen.getByTestId('ask-participant1');
    within(askParticipant1).getByText('John Doe');
    within(askParticipant1).getByRole('button', { name: 'accept' });
    within(askParticipant1).getByRole('button', {
      name: 'reject',
    });

    // reject the request
    rerender(
      wrapInIntlProvider(
        <DashboardJoinDiscussion
          video={{ ...video, participants_asking_to_join: [] }}
        />,
      ),
    );

    // nobody is in the waiting list
    expect(screen.queryByTestId('ask-participant1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ask-participant2')).not.toBeInTheDocument();

    // add participant 2 to the waiting list
    rerender(
      wrapInIntlProvider(
        <DashboardJoinDiscussion
          video={{ ...video, participants_asking_to_join: [participant2] }}
        />,
      ),
    );

    const askParticipant2 = screen.getByTestId('ask-participant2');
    within(askParticipant2).getByText('Jane Doe');
    within(askParticipant2).getByRole('button', {
      name: 'accept',
    });
    within(askParticipant1).getByRole('button', { name: 'reject' });

    // nobody is in the discussion
    expect(screen.queryByTestId('in-participant1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('in-participant2')).not.toBeInTheDocument();

    // accept the participant 2
    rerender(
      wrapInIntlProvider(
        <DashboardJoinDiscussion
          video={{ ...video, participants_in_discussion: [participant2] }}
        />,
      ),
    );

    // participant 2 is in the discussion
    const inParticipant2 = screen.getByTestId('in-participant2');

    within(inParticipant2).getByRole('button', {
      name: 'kick out participant',
    });

    // remove participant 2 from discussion
    rerender(
      wrapInIntlProvider(
        <DashboardJoinDiscussion
          video={{
            ...video,
            participants_asking_to_join: [],
            participants_in_discussion: [],
          }}
        />,
      ),
    );

    // nobody in the waiting list nor in the discussion
    expect(screen.queryByTestId('ask-participant1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ask-participant2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('in-participant1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('in-participant2')).not.toBeInTheDocument();
  });
});
