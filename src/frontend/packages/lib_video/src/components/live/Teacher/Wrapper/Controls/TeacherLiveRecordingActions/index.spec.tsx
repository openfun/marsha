import { QueryClient } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { liveState, videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { TeacherLiveRecordingActions } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({}),
}));

let queryClient: QueryClient;

describe('<TeacherLiveRecordingActions />', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  it('does not render actions when live is not running', () => {
    const video = videoMockFactory();

    render(
      wrapInVideo(<TeacherLiveRecordingActions isJitsiAdministrator />, video),
      {
        queryOptions: { client: queryClient },
      },
    );

    expect(screen.queryByTestId('start-recording')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stop-recording')).not.toBeInTheDocument();
  });

  it('renders start recording when live is running and is_recording is undefined', () => {
    const video = videoMockFactory({ live_state: liveState.RUNNING });

    render(
      wrapInVideo(<TeacherLiveRecordingActions isJitsiAdministrator />, video),
      {
        queryOptions: { client: queryClient },
      },
    );

    screen.getByTestId('start-recording');
    expect(screen.queryByTestId('stop-recording')).not.toBeInTheDocument();
  });

  it('renders start recording when live is running and is_recording is false', () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
      is_recording: false,
    });

    render(
      wrapInVideo(<TeacherLiveRecordingActions isJitsiAdministrator />, video),
      {
        queryOptions: { client: queryClient },
      },
    );

    screen.getByTestId('start-recording');
    expect(screen.queryByTestId('stop-recording')).not.toBeInTheDocument();
  });

  it('renders the stop button when live is running and we are recording', () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
      is_recording: true,
    });

    render(
      wrapInVideo(<TeacherLiveRecordingActions isJitsiAdministrator />, video),
      {
        queryOptions: { client: queryClient },
      },
    );

    expect(screen.queryByTestId('start-recording')).not.toBeInTheDocument();
    screen.getByTestId('stop-recording');
  });

  it('does not render buttons if you are not an administrator', () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
      is_recording: true,
    });

    render(
      wrapInVideo(
        <TeacherLiveRecordingActions isJitsiAdministrator={false} />,
        video,
      ),
      {
        queryOptions: { client: queryClient },
      },
    );

    expect(screen.queryByTestId('start-recording')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stop-recording')).not.toBeInTheDocument();
  });

  it('does not render buttons if the live recording is disallowed', () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
      allow_recording: false,
    });

    render(
      wrapInVideo(<TeacherLiveRecordingActions isJitsiAdministrator />, video),
      {
        queryOptions: { client: queryClient },
      },
    );

    expect(
      screen.queryByRole('button', { name: 'Start recording' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /stop recording/i }),
    ).not.toBeInTheDocument();
  });
});
