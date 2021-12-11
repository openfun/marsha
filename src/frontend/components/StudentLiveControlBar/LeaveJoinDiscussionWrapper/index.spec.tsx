import React from 'react';
import MatchMediaMock from 'jest-matchmedia-mock';
import { Toaster } from 'react-hot-toast';
import { render, screen } from '@testing-library/react';

import { PLAYER_ROUTE } from 'components/routes';
import { PUBLIC_JITSI_ROUTE } from 'components/PublicVideoLiveJitsi/route';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { LeaveJoinDiscussionWrapper } from '.';
import { modelName } from 'types/models';

let matchMedia: MatchMediaMock;

describe('<LeaveJoinDiscussionWrapper />', () => {
  beforeEach(() => {
    matchMedia = new MatchMediaMock();
  });

  afterEach(() => {
    matchMedia.clear();
    jest.resetAllMocks();
  });

  it('renders the join discussion button when not accepted and on the player page', () => {
    useParticipantWorkflow.setState({
      accepted: false,
    });

    render(
      wrapInRouter(
        wrapInIntlProvider(<LeaveJoinDiscussionWrapper />),
        undefined,
        PLAYER_ROUTE(modelName.VIDEOS),
      ),
    );

    screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
    expect(
      screen.queryByRole('button', { name: 'Leave discussion' }),
    ).not.toBeInTheDocument();
  });

  it('renders the leave discussion button when accepted and on the jitsi page', () => {
    useParticipantWorkflow.setState({
      accepted: true,
    });

    render(
      wrapInRouter(
        wrapInIntlProvider(<LeaveJoinDiscussionWrapper />),
        undefined,
        PUBLIC_JITSI_ROUTE(),
      ),
    );

    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Leave discussion' });
  });

  it('redirects to player if you are not accepted on stage and not on the player path', () => {
    useParticipantWorkflow.setState({
      accepted: false,
    });

    render(
      wrapInRouter(
        wrapInIntlProvider(<LeaveJoinDiscussionWrapper />),
        [
          {
            path: PLAYER_ROUTE(modelName.VIDEOS),
            render: () => <span>player</span>,
          },
        ],
        PUBLIC_JITSI_ROUTE(),
      ),
    );

    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Leave discussion' }),
    ).not.toBeInTheDocument();

    screen.getByText('player');
  });

  it('redirects to jitsi if you are accepted on stage and not on the jitsi path', () => {
    useParticipantWorkflow.setState({
      accepted: true,
    });

    render(
      wrapInRouter(
        wrapInIntlProvider(<LeaveJoinDiscussionWrapper />),
        [{ path: PUBLIC_JITSI_ROUTE(), render: () => <span>jitsi</span> }],
        PLAYER_ROUTE(modelName.VIDEOS),
      ),
    );

    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Leave discussion' }),
    ).not.toBeInTheDocument();

    screen.getByText('jitsi');
  });

  it('renders the toast alert and reset the store when user is rejected', async () => {
    useParticipantWorkflow.setState({
      rejected: true,
    });

    render(
      wrapInRouter(
        wrapInIntlProvider(
          <React.Fragment>
            <Toaster />
            <LeaveJoinDiscussionWrapper />
          </React.Fragment>,
        ),
        undefined,
        PLAYER_ROUTE(modelName.VIDEOS),
      ),
    );

    await screen.getByText(
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
