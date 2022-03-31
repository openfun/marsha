import { render, screen } from '@testing-library/react';
import MatchMediaMock from 'jest-matchmedia-mock';
import React from 'react';
import { Toaster } from 'react-hot-toast';

import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { LeaveJoinDiscussionWrapper } from '.';

let matchMedia: MatchMediaMock;

jest.mock('data/stores/useSetDisplayName', () => ({
  useSetDisplayName: () => [false, jest.fn()],
}));

describe('<LeaveJoinDiscussionWrapper />', () => {
  beforeEach(() => {
    matchMedia = new MatchMediaMock();
  });

  afterEach(() => {
    matchMedia.clear();
    jest.resetAllMocks();
  });

  it('renders the join discussion button when not accepted', () => {
    useParticipantWorkflow.setState({
      accepted: false,
    });

    render(wrapInIntlProvider(<LeaveJoinDiscussionWrapper />));

    screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
    expect(
      screen.queryByRole('button', { name: 'Leave discussion' }),
    ).not.toBeInTheDocument();
  });

  it('renders the waitingJoinDiscussion icon when user has asked to join', async () => {
    useParticipantWorkflow.setState({
      asked: true,
    });

    render(wrapInIntlProvider(<LeaveJoinDiscussionWrapper />));

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

    render(wrapInIntlProvider(<LeaveJoinDiscussionWrapper />));

    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Leave discussion' });
  });

  it('renders the toast alert and reset the store when user is rejected', async () => {
    useParticipantWorkflow.setState({
      rejected: true,
    });

    render(
      wrapInIntlProvider(
        <React.Fragment>
          <Toaster />
          <LeaveJoinDiscussionWrapper />
        </React.Fragment>,
      ),
    );

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
