import { render, screen } from '@testing-library/react';
import React from 'react';

import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { liveState } from 'types/tracks';

import { TeacherLiveLifecycleControls } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

describe('<TeacherLiveLifecycleControls />', () => {
  it('renders info when you are not an jitsi moderator', () => {
    const video = videoMockFactory({ live_state: liveState.IDLE });

    render(
      wrapInIntlProvider(
        <TeacherLiveLifecycleControls
          canStartStreaming={true}
          hasRightToStart={false}
          video={video}
        />,
      ),
    );

    //  only admin message is visible
    screen.getByText('Only a jitsi moderator can administrate the live');

    expect(
      screen.queryByText('Join the room before start streaming'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start streaming' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Starting')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pause live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'End live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resume streaming' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Pausing')).not.toBeInTheDocument();
  });

  it('renders info to join the room to be able to start the stream', () => {
    const video = videoMockFactory({ live_state: liveState.IDLE });

    render(
      wrapInIntlProvider(
        <TeacherLiveLifecycleControls
          canStartStreaming={false}
          hasRightToStart={false}
          video={video}
        />,
      ),
    );

    //  only message to join the room is visible
    screen.getByText('Join the room before start streaming');

    expect(
      screen.queryByText('Only the admin can administrate the live'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start streaming' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Starting')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pause live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'End live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resume streaming' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Pausing')).not.toBeInTheDocument();
  });

  it('renders the start button when live is idle', () => {
    const video = videoMockFactory({ live_state: liveState.IDLE });

    render(
      wrapInIntlProvider(
        <TeacherLiveLifecycleControls
          canStartStreaming={true}
          hasRightToStart={true}
          video={video}
        />,
      ),
    );

    //  start button is visible
    screen.getByRole('button', { name: 'Start streaming' });

    expect(
      screen.queryByText('Only the admin can administrate the live'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Join the room before start streaming'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Starting')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pause live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'End live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resume streaming' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Pausing')).not.toBeInTheDocument();
  });

  it('renders the starting message', () => {
    const video = videoMockFactory({ live_state: liveState.STARTING });

    render(
      wrapInIntlProvider(
        <TeacherLiveLifecycleControls
          canStartStreaming={true}
          hasRightToStart={true}
          video={video}
        />,
      ),
    );

    //  live is starting, render the message
    screen.getByText('Starting');

    expect(
      screen.queryByText('Only the admin can administrate the live'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Join the room before start streaming'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start streaming' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pause live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'End live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resume streaming' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Pausing')).not.toBeInTheDocument();
  });

  it('renders the pause button when live is running', () => {
    const video = videoMockFactory({ live_state: liveState.RUNNING });

    render(
      wrapInIntlProvider(
        <TeacherLiveLifecycleControls
          canStartStreaming={true}
          hasRightToStart={true}
          video={video}
        />,
      ),
    );

    //  live is running, we can pause it
    screen.getByRole('button', { name: 'Pause live' });

    expect(
      screen.queryByText('Only the admin can administrate the live'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Join the room before start streaming'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start streaming' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Starting')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'End live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resume streaming' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Pausing')).not.toBeInTheDocument();
  });

  it('renders the stop and resume buttons when live is paused', () => {
    const video = videoMockFactory({ live_state: liveState.PAUSED });

    render(
      wrapInIntlProvider(
        <TeacherLiveLifecycleControls
          canStartStreaming={true}
          hasRightToStart={true}
          video={video}
        />,
      ),
    );

    //  live is paused, you can stop it or resume it
    screen.getByRole('button', { name: 'End live' });
    screen.getByRole('button', { name: 'Resume streaming' });

    expect(
      screen.queryByText('Only the admin can administrate the live'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Join the room before start streaming'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start streaming' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Starting')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pause live' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Pausing')).not.toBeInTheDocument();
  });

  it('renders the pause message when live is stopping', () => {
    const video = videoMockFactory({ live_state: liveState.STOPPING });

    render(
      wrapInIntlProvider(
        <TeacherLiveLifecycleControls
          canStartStreaming={true}
          hasRightToStart={true}
          video={video}
        />,
      ),
    );

    //  live is pausing, render the message
    screen.getByText('Pausing');

    expect(
      screen.queryByText('Only the admin can administrate the live'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Join the room before start streaming'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start streaming' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Starting')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pause live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'End live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resume streaming' }),
    ).not.toBeInTheDocument();
  });
});
