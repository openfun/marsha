import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { CHAT_ROUTE } from '../Chat/route';
import { PLAYER_ROUTE } from '../routes';
import { modelName } from '../../types/models';
import { liveState, uploadState } from '../../types/tracks';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import { DashboardVideoLive } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('../../data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

describe('components/DashboardVideoLive', () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  const video = videoMockFactory({
    description: '',
    has_transcript: false,
    id: '9e02ae7d-6c18-40ce-95e8-f87bbeae31c5',
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
    playlist: {
      title: 'foo',
      lti_id: 'foo+context_id',
    },
    live_state: liveState.IDLE,
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
  });

  it('displays streaming links', () => {
    render(
      wrapInIntlProvider(wrapInRouter(<DashboardVideoLive video={video} />)),
    );

    screen.getByText('Streaming link');
    screen.getByText('rtmp://1.2.3.4:1935');
    screen.getByText('stream-key-primary');
    screen.getByText('rtmp://4.3.2.1:1935');
    screen.getByText('stream-key-secondary');

    screen.getByRole('button', { name: 'copy url rtmp://1.2.3.4:1935' });
    screen.getByRole('button', { name: 'copy key stream-key-primary' });

    screen.getByRole('button', { name: 'copy url rtmp://4.3.2.1:1935' });
    screen.getByRole('button', { name: 'copy key stream-key-secondary' });
  });

  it('shows the start button when the status id IDLE', () => {
    render(
      wrapInIntlProvider(wrapInRouter(<DashboardVideoLive video={video} />)),
    );

    screen.getByRole('button', { name: /start streaming/i });
  });

  it('shows the live and stop button when the status is LIVE', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLive
            video={{ ...video, live_state: liveState.RUNNING }}
          />,
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
          <DashboardVideoLive
            video={{ ...video, live_state: liveState.RUNNING }}
          />,
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
          <DashboardVideoLive
            video={{ ...video, live_state: liveState.RUNNING }}
          />,
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
      '/api/videos/9e02ae7d-6c18-40ce-95e8-f87bbeae31c5/',
      JSON.stringify({ ...video, live_state: liveState.STARTING }),
    );

    const { rerender } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLive
            video={{ ...video, live_state: liveState.STARTING }}
          />,
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

    expect(fetchMock.lastCall()![0]).toEqual(
      '/api/videos/9e02ae7d-6c18-40ce-95e8-f87bbeae31c5/',
    );
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });
    screen.getByText(
      'Live streaming is starting. Wait before starting your stream.',
    );

    // The live will be running in further response
    fetchMock.restore();
    fetchMock.mock(
      '/api/videos/9e02ae7d-6c18-40ce-95e8-f87bbeae31c5/',
      JSON.stringify({ ...video, live_state: liveState.RUNNING }),
    );

    // Second backend call
    expect(fetchMock.called()).not.toBeTruthy();
    jest.advanceTimersByTime(1000 * 15 + 200);
    await waitFor(() => expect(fetchMock.called()).toBe(true));

    expect(fetchMock.lastCall()![0]).toEqual(
      '/api/videos/9e02ae7d-6c18-40ce-95e8-f87bbeae31c5/',
    );
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });

    rerender(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLive
            video={{ ...video, live_state: liveState.RUNNING }}
          />,
        ),
      ),
    );

    screen.getByRole('button', { name: /show live/i });
    screen.getByRole('button', { name: /stop streaming/i });
  });
});
