import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { useParticipantWorkflow } from '@lib-video/hooks/useParticipantWorkflow';

import { LeaveJoinDiscussionWrapper } from '.';

jest.mock('hooks/useSetDisplayName', () => ({
  useSetDisplayName: () => [false, jest.fn()],
}));

describe('<LeaveJoinDiscussionWrapper />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the join discussion button when not accepted', () => {
    useParticipantWorkflow.setState({
      accepted: false,
    });

    render(<LeaveJoinDiscussionWrapper />);

    screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
    expect(
      screen.queryByRole('button', { name: 'Leave discussion' }),
    ).not.toBeInTheDocument();
  });

  it('renders the waitingJoinDiscussion icon when user has asked to join', () => {
    useParticipantWorkflow.setState({
      asked: true,
    });

    render(<LeaveJoinDiscussionWrapper />);

    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Leave discussion' }),
    ).not.toBeInTheDocument();

    screen.getByText("Waiting for Instructor's response");
  });

  it('renders the leave discussion button when accepted', () => {
    useParticipantWorkflow.setState({
      accepted: true,
    });

    render(<LeaveJoinDiscussionWrapper />);

    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Leave discussion' });
  });

  it('renders the toast alert and reset the store when user is rejected', () => {
    useParticipantWorkflow.setState({
      rejected: true,
    });

    render(<LeaveJoinDiscussionWrapper />);

    screen.getByText(
      'Your request to join the discussion has not been accepted.',
    );

    screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
    expect(
      screen.queryByRole('button', { name: 'Leave discussion' }),
    ).not.toBeInTheDocument();

    expect(useParticipantWorkflow.getState().accepted).toBe(false);
    expect(useParticipantWorkflow.getState().asked).toBe(false);
    expect(useParticipantWorkflow.getState().kicked).toBe(false);
    expect(useParticipantWorkflow.getState().rejected).toBe(false);
  });
});
