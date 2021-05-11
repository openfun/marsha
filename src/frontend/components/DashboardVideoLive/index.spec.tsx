import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React, { Suspense } from 'react';

import { CHAT_ROUTE } from '../Chat/route';
import { PLAYER_ROUTE } from '../routes';
import { modelName } from '../../types/models';
import {
  LiveModeType,
  liveState,
  uploadState,
  Video,
} from '../../types/tracks';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import { DashboardVideoLive } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('../../data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));
jest.mock('../DashboardVideoLiveRaw', () => (props: { video: Video }) => (
  <span title={props.video.id} />
));

jest.mock('../DashboardVideoLiveJitsi', () => (props: { video: Video }) => (
  <span title={props.video.id}>jitsi</span>
));

describe('components/DashboardVideoLive', () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  const video = videoMockFactory({
    is_ready_to_show: true,
    show_download: true,
    thumbnail: null,
    timed_text_tracks: [],
    title: '',
    upload_state: uploadState.PENDING,
    urls: {
      manifests: {
        hls: 'https://example.com/hls',
      },
      mp4: {},
      thumbnails: {},
    },
    should_use_subtitle_as_transcript: false,
    live_info: {
      medialive: {
        input: {
          endpoints: [
            'rtmp://1.2.3.4:1935/stream-key-primary',
            'rtmp://4.3.2.1:1935/stream-key-secondary',
          ],
        },
      },
    },
    live_type: LiveModeType.RAW,
  });

  it('shows the start and jitsi button when the status is IDLE', async () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{ ...video, live_state: liveState.IDLE }}
            />
          </Suspense>,
        ),
      ),
    );

    await screen.findByRole('button', { name: /start streaming/i });
    screen.getByRole('button', { name: /Launch Jitsi LiveStream/i });
  });

  it('shows only the start button when status is IDLE and live type is JITSI', async () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{
                ...video,
                live_state: liveState.IDLE,
                live_type: LiveModeType.JITSI,
              }}
            />
          </Suspense>,
        ),
      ),
    );

    await screen.findByRole('button', { name: /start streaming/i });
    expect(
      screen.queryByRole('button', { name: /Launch Jitsi LiveStream/i }),
    ).not.toBeInTheDocument();
  });

  it('shows the live and stop button when the status is LIVE', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{ ...video, live_state: liveState.RUNNING }}
            />
          </Suspense>,
        ),
      ),
    );

    screen.getByRole('button', { name: /show chat only/i });
    screen.getByRole('button', { name: /show live/i });
    screen.getByRole('button', { name: /stop streaming/i });
  });

  it('polls the video when live state is STARTING', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/`,
      JSON.stringify({ ...video, live_state: liveState.STARTING }),
    );

    const { rerender } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{ ...video, live_state: liveState.STARTING }}
            />
          </Suspense>,
        ),
      ),
    );

    screen.getByText(
      'Live streaming is starting. Wait before starting your stream.',
    );
    expect(fetchMock.called()).not.toBeTruthy();

    // First backend call: the live is still starting
    jest.advanceTimersByTime(1000 * 15 + 200);
    await waitFor(() => expect(fetchMock.called()).toBe(true));

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });
    screen.getByText(
      'Live streaming is starting. Wait before starting your stream.',
    );

    // The live will be running in further response
    fetchMock.restore();
    fetchMock.mock(
      `/api/videos/${video.id}/`,
      JSON.stringify({ ...video, live_state: liveState.RUNNING }),
    );

    // Second backend call
    expect(fetchMock.called()).not.toBeTruthy();
    jest.advanceTimersByTime(1000 * 15 + 200);
    await waitFor(() => expect(fetchMock.called()).toBe(true));

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });

    rerender(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{ ...video, live_state: liveState.RUNNING }}
            />
          </Suspense>,
        ),
      ),
    );

    screen.getByRole('button', { name: /show live/i });
    screen.getByRole('button', { name: /stop streaming/i });
  });
});
