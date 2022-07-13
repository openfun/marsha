import { screen } from '@testing-library/react';
import React from 'react';

import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';
import { liveState } from 'types/tracks';

import { TeacherLiveLifecycleControls } from '.';

jest.mock('data/stores/useLiveModale', () => ({
  useLiveModaleConfiguration: () => [false, jest.fn()],
}));

jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

describe('<TeacherLiveLifecycleControls />', () => {
  it('renders info when you are not an jitsi moderator', () => {
    const video = videoMockFactory({ live_state: liveState.IDLE });

    render(
      wrapInVideo(
        <TeacherLiveLifecycleControls
          canStartStreaming={true}
          hasRightToStart={false}
        />,
        video,
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
      screen.queryByRole('button', { name: 'End live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resume streaming' }),
    ).not.toBeInTheDocument();
  });

  it('renders info to join the room to be able to start the stream', () => {
    const video = videoMockFactory({ live_state: liveState.IDLE });

    render(
      wrapInVideo(
        <TeacherLiveLifecycleControls
          canStartStreaming={false}
          hasRightToStart={false}
        />,
        video,
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
      screen.queryByRole('button', { name: 'End live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resume streaming' }),
    ).not.toBeInTheDocument();
  });

  it('renders the start button when live is idle', () => {
    const video = videoMockFactory({ live_state: liveState.IDLE });

    render(
      wrapInVideo(
        <TeacherLiveLifecycleControls
          canStartStreaming={true}
          hasRightToStart={true}
        />,
        video,
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
      screen.queryByRole('button', { name: 'End live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resume streaming' }),
    ).not.toBeInTheDocument();
  });

  it('renders the starting message', () => {
    const video = videoMockFactory({ live_state: liveState.STARTING });

    render(
      wrapInVideo(
        <TeacherLiveLifecycleControls
          canStartStreaming={true}
          hasRightToStart={true}
        />,
        video,
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
      screen.queryByRole('button', { name: 'End live' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resume streaming' }),
    ).not.toBeInTheDocument();
  });

  it('renders the end button when live is running', () => {
    const video = videoMockFactory({ live_state: liveState.RUNNING });

    render(
      wrapInVideo(
        <TeacherLiveLifecycleControls
          canStartStreaming={true}
          hasRightToStart={true}
        />,
        video,
      ),
    );

    //  live is running, we can pause it
    screen.getByRole('button', { name: 'End live' });

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
      screen.queryByRole('button', { name: 'Resume streaming' }),
    ).not.toBeInTheDocument();
  });

  it('renders the stop message when live is stopping', () => {
    const video = videoMockFactory({ live_state: liveState.STOPPING });

    render(
      wrapInVideo(
        <TeacherLiveLifecycleControls
          canStartStreaming={true}
          hasRightToStart={true}
        />,
        video,
      ),
    );

    //  live is stopping, render the message
    screen.getByText('Stopping');

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
  });

  it('renders the harvesting message when live is harvesting', () => {
    const video = videoMockFactory({ live_state: liveState.HARVESTING });

    render(
      wrapInVideo(
        <TeacherLiveLifecycleControls
          canStartStreaming={true}
          hasRightToStart={true}
        />,
        video,
      ),
    );

    //  live is stopping, render the message
    screen.getByText('Harvesting in progress');

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
  });

  it('throws an error when live has no live_state', () => {
    const video = videoMockFactory({ live_state: null });

    try {
      render(
        wrapInVideo(
          <TeacherLiveLifecycleControls
            canStartStreaming={true}
            hasRightToStart={true}
          />,
          video,
        ),
      );
    } catch (e: any) {
      expect(e.message).toEqual(
        'This should not happen, you need to check a live is ready for the video before using this component.',
      );
    }
  });
});
