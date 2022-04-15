import { render, screen } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { liveState } from 'types/tracks';

import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { TeacherLiveRecordingActions } from '.';

jest.mock('data/appData', () => ({
  appData: {},
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
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <TeacherLiveRecordingActions isJitsiAdministrator video={video} />
        </QueryClientProvider>,
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Start recording' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Stop recording 0 0 : 0 0 : 0 0' }),
    ).not.toBeInTheDocument();
  });

  it('renders start recording when live is running and is_recording is undefined', () => {
    const video = videoMockFactory({ live_state: liveState.RUNNING });

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <TeacherLiveRecordingActions isJitsiAdministrator video={video} />
        </QueryClientProvider>,
      ),
    );

    screen.getByRole('button', { name: 'Start recording' });
    expect(
      screen.queryByRole('button', { name: 'Stop recording 0 0 : 0 0 : 0 0' }),
    ).not.toBeInTheDocument();
  });

  it('renders start recording when live is running and is_recording is false', () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
      is_recording: false,
    });

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <TeacherLiveRecordingActions isJitsiAdministrator video={video} />
        </QueryClientProvider>,
      ),
    );

    screen.getByRole('button', { name: 'Start recording' });
    expect(
      screen.queryByRole('button', { name: 'Stop recording 0 0 : 0 0 : 0 0' }),
    ).not.toBeInTheDocument();
  });

  it('renders the stop button when live is running and we are recording', () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
      is_recording: true,
    });

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <TeacherLiveRecordingActions isJitsiAdministrator video={video} />
        </QueryClientProvider>,
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Start recording' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Stop recording 0 0 : 0 0 : 0 0' });
  });

  it('does not render buttons if you are not an administrator', () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
      is_recording: true,
    });

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <TeacherLiveRecordingActions
            isJitsiAdministrator={false}
            video={video}
          />
        </QueryClientProvider>,
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Start recording' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /stop recording/i }),
    ).not.toBeInTheDocument();
  });

  it('does not render buttons if the live recording is disallowed', () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
      allow_recording: false,
    });

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <TeacherLiveRecordingActions
            isJitsiAdministrator={true}
            video={video}
          />
        </QueryClientProvider>,
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Start recording' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /stop recording/i }),
    ).not.toBeInTheDocument();
  });
});
