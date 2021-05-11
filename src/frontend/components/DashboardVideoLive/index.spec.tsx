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
      type: LiveModeType.RAW,
    },
  });

  it('shows the start button when the status is IDLE', () => {
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

    screen.getByText('start streaming');
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

  it('clicks on show live and redirects to the video player', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{ ...video, live_state: liveState.RUNNING }}
            />
          </Suspense>,
          [
            {
              path: PLAYER_ROUTE(modelName.VIDEOS),
              render: () => <span>video player</span>,
            },
          ],
        ),
      ),
    );

    const showLiveButton = screen.getByRole('button', { name: /show live/i });
    expect(screen.queryByText('video player')).not.toBeInTheDocument();

    fireEvent.click(showLiveButton);

    screen.getByText('video player');
  });

  it('clicks on show chat only and redirects to the chat component', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{ ...video, live_state: liveState.RUNNING }}
            />
          </Suspense>,
          [
            {
              path: CHAT_ROUTE(),
              render: () => <span>chat component</span>,
            },
          ],
        ),
      ),
    );

    const showChatOnlyButton = screen.getByRole('button', {
      name: /show chat only/i,
    });
    expect(screen.queryByText('chat component')).not.toBeInTheDocument();

    fireEvent.click(showChatOnlyButton);

    screen.getByText('chat component');
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
