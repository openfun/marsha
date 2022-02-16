import { render, screen } from '@testing-library/react';
import React from 'react';

import { useJoinParticipant } from 'data/stores/useJoinParticipant';
import { LiveModeType } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { DashboardVideoLiveRunning } from '.';

jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

const video = videoMockFactory({ live_type: LiveModeType.JITSI });

describe('<DashboardVideoLiveRunning />', () => {
  it('renders participants in the discussion', () => {
    useJoinParticipant.setState({
      participantsInDiscussion: [{ id: 'an_other_id', name: 'his name' }],
    });

    render(wrapInIntlProvider(<DashboardVideoLiveRunning video={video} />));

    screen.getByText('his name');
    screen.getByText('has joined the discussion.');
    screen.getByRole('button', { name: 'kick out participant' });
  });

  it('renders participants asking to join', () => {
    useJoinParticipant.setState({
      participantsAskingToJoin: [{ id: 'some_id', name: 'my name' }],
    });

    render(wrapInIntlProvider(<DashboardVideoLiveRunning video={video} />));

    screen.getByText('my name');
    screen.getByText('is asking to join the discussion.');
    screen.getByRole('button', { name: 'accept' });
    screen.getByRole('button', { name: 'reject' });
  });
});
