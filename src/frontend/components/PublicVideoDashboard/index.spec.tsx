import { render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { DateTime } from 'luxon';
import React from 'react';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { useLiveStateStarted } from 'data/stores/useLiveStateStarted';
import {
  useLivePanelState,
  LivePanelItem,
} from 'data/stores/useLivePanelState';
import { useTimedTextTrack } from 'data/stores/useTimedTextTrack';
import { createPlayer } from 'Player/createPlayer';
import { liveState, timedTextMode } from 'types/tracks';
import { timedTextMockFactory, videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import PublicVideoDashboard from '.';

window.HTMLElement.prototype.scrollTo = jest.fn();

jest.mock('Player/createPlayer', () => ({
  createPlayer: jest.fn(),
}));
jest.mock('data/sideEffects/getResource', () => ({
  getResource: jest.fn().mockResolvedValue(null),
}));
jest.mock('data/sideEffects/pollForLive', () => ({
  pollForLive: jest.fn(),
}));
jest.mock('utils/resumeLive', () => ({
  resumeLive: jest.fn().mockResolvedValue(null),
}));
jest.mock('video.js', () => ({
  __esModule: true,
  default: {
    getPlayers: () => ({
      r2d2: {
        currentSource: () => 'https://live.m3u8',
        src: jest.fn(),
      },
    }),
  },
}));

const mockCreatePlayer = createPlayer as jest.MockedFunction<
  typeof createPlayer
>;

let mockCanUpdate: boolean;
const mockVideo = videoMockFactory();
jest.mock('data/appData', () => ({
  appData: {
    video: mockVideo,
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  },
  getDecodedJwt: () => ({
    permissions: {
      can_update: mockCanUpdate,
    },
  }),
}));

jest.mock('utils/conversejs/converse', () => ({
  converseMounter: jest.fn(() => jest.fn()),
}));

window.HTMLElement.prototype.scrollTo = jest.fn();

describe('PublicVideoDashboard', () => {
  beforeEach(() => {
    fetchMock.mock(
      '/api/timedtexttracks/',
      {
        actions: {
          POST: {
            language: {
              choices: [
                { display_name: 'English', value: 'en' },
                { display_name: 'French', value: 'fr' },
              ],
            },
          },
        },
      },
      { method: 'OPTIONS' },
    );
    mockCreatePlayer.mockReturnValue({
      destroy: jest.fn(),
      getSource: jest.fn(),
      setSource: jest.fn(),
    });
    mockCanUpdate = false;
    useLiveStateStarted.setState({
      isStarted: true,
    });

    jest.useFakeTimers();
    //    set system date to 2022-01-27T14:00:00
    jest.setSystemTime(new Date(2022, 1, 27, 14, 0, 0));
  });

  afterEach(() => {
    fetchMock.restore();
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('displays the video player alone', async () => {
    const video = videoMockFactory({
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {
          144: 'https://example.com/144p.mp4',
          1080: 'https://example.com/1080p.mp4',
        },
        thumbnails: {
          144: 'https://example.com/thumbnail/144p.jpg',
          1080: 'https://example.com/thumbnail/1080p.jpg',
        },
      },
    });

    const { container } = render(
      wrapInIntlProvider(
        <PublicVideoDashboard video={video} playerType="videojs" />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'videojs',
        expect.any(Element),
        expect.anything(),
        video,
      ),
    );

    expect(
      container.querySelector('source[src="https://example.com/144p.mp4"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('source[src="https://example.com/1080p.mp4"]'),
    ).not.toBeNull();
    expect(container.querySelectorAll('source[type="video/mp4"]')).toHaveLength(
      2,
    );
    const videoElement = container.querySelector('video')!;
    expect(videoElement.tabIndex).toEqual(-1);
    expect(videoElement.poster).toEqual(
      'https://example.com/thumbnail/1080p.jpg',
    );
  });

  it('displays the video player, the download link and transcripts', async () => {
    const timedTextTracks = [
      timedTextMockFactory({
        is_ready_to_show: true,
        mode: timedTextMode.TRANSCRIPT,
      }),
    ];
    useTimedTextTrack.getState().addMultipleResources(timedTextTracks);
    const video = videoMockFactory({
      has_transcript: true,
      show_download: true,
      timed_text_tracks: timedTextTracks,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {
          144: 'https://example.com/144p.mp4',
          1080: 'https://example.com/1080p.mp4',
        },
        thumbnails: {
          144: 'https://example.com/thumbnail/144p.jpg',
          1080: 'https://example.com/thumbnail/1080p.jpg',
        },
      },
    });

    const { container } = render(
      wrapInIntlProvider(
        <PublicVideoDashboard video={video} playerType="videojs" />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'videojs',
        expect.any(Element),
        expect.anything(),
        video,
      ),
    );

    screen.getByText(/Download this video/i);
    screen.getByText('Show a transcript');
    expect(
      container.querySelector('source[src="https://example.com/144p.mp4"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('source[src="https://example.com/1080p.mp4"]'),
    ).not.toBeNull();
    expect(container.querySelectorAll('source[type="video/mp4"]')).toHaveLength(
      2,
    );
    const videoElement = container.querySelector('video')!;
    expect(videoElement.tabIndex).toEqual(-1);
    expect(videoElement.poster).toEqual(
      'https://example.com/thumbnail/1080p.jpg',
    );
  });

  it('uses subtitles as transcripts', async () => {
    const timedTextTracks = [
      timedTextMockFactory({
        id: 'ttt-1',
        is_ready_to_show: true,
        mode: timedTextMode.SUBTITLE,
      }),
    ];
    useTimedTextTrack.getState().addMultipleResources(timedTextTracks);
    const video = videoMockFactory({
      has_transcript: false,
      show_download: true,
      should_use_subtitle_as_transcript: true,
      timed_text_tracks: timedTextTracks,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {
          144: 'https://example.com/144p.mp4',
          1080: 'https://example.com/1080p.mp4',
        },
        thumbnails: {
          144: 'https://example.com/thumbnail/144p.jpg',
          1080: 'https://example.com/thumbnail/1080p.jpg',
        },
      },
    });

    const { container } = render(
      wrapInIntlProvider(
        <PublicVideoDashboard video={video} playerType="videojs" />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'videojs',
        expect.any(Element),
        expect.anything(),
        video,
      ),
    );

    screen.getByText(/Download this video/i);
    screen.getByText('Show a transcript');
    expect(
      container.querySelector('source[src="https://example.com/144p.mp4"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('source[src="https://example.com/1080p.mp4"]'),
    ).not.toBeNull();
    expect(container.querySelectorAll('source[type="video/mp4"]')).toHaveLength(
      2,
    );
    const videoElement = container.querySelector('video')!;
    expect(videoElement.tabIndex).toEqual(-1);
    expect(videoElement.poster).toEqual(
      'https://example.com/thumbnail/1080p.jpg',
    );

    expect(container.querySelector('option[value="ttt-1"]')).not.toBeNull();
  });

  it('displays the video player, the tile, the chat and chat action', async () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.CHAT],
    });
    useLiveStateStarted.getState().setIsStarted(true);
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.RUNNING,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    const { container } = render(
      wrapInIntlProvider(
        <PublicVideoDashboard video={video} playerType="videojs" />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'videojs',
        expect.any(Element),
        expect.anything(),
        video,
      ),
    );

    const videoElement = container.querySelector('video')!;
    expect(videoElement.tabIndex).toEqual(-1);

    screen.getByText('live title');

    screen.getByRole('button', { name: 'Hide chat' });
    screen.getByRole('button', { name: 'Show viewers' });
    screen.getByText('Join the chat');
  });

  it('displays the video player and the waiting message when the live is stopping', async () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.CHAT],
    });
    useLiveStateStarted.getState().setIsStarted(true);
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.STOPPING,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    const { container } = render(
      wrapInIntlProvider(
        <PublicVideoDashboard video={video} playerType="videojs" />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'videojs',
        expect.any(Element),
        expect.anything(),
        video,
      ),
    );

    const videoElement = container.querySelector('video')!;
    expect(videoElement.tabIndex).toEqual(-1);

    screen.getByText('live title');

    screen.getByRole('button', { name: 'Hide chat' });
    screen.getByRole('button', { name: 'Show viewers' });
    screen.getByText('Join the chat');

    screen.getByText('Webinar is paused');
  });

  it('displays the waiting message when the live is starting', async () => {
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.STARTING,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });
    useLiveStateStarted.setState({
      isStarted: false,
    });

    render(
      wrapInIntlProvider(
        <PublicVideoDashboard video={video} playerType="videojs" />,
      ),
    );

    screen.getByRole('heading', {
      name: 'Live is starting',
    });
  });

  it('displays the video player and the waiting message when the live is paused', async () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.CHAT],
    });
    useLiveStateStarted.getState().setIsStarted(true);
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.PAUSED,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    const { container } = render(
      wrapInIntlProvider(
        <PublicVideoDashboard video={video} playerType="videojs" />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'videojs',
        expect.any(Element),
        expect.anything(),
        video,
      ),
    );

    const videoElement = container.querySelector('video')!;
    expect(videoElement.tabIndex).toEqual(-1);

    screen.getByText('live title');

    screen.getByRole('button', { name: 'Hide chat' });
    screen.getByRole('button', { name: 'Show viewers' });
    screen.getByText('Join the chat');

    screen.getByText('Webinar is paused');
  });

  it('redirects to the error component when user has no update permission and live state is stopped', () => {
    const video = videoMockFactory({
      live_state: liveState.STOPPED,
    });
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <PublicVideoDashboard video={video} playerType="videojs" />,
          [
            {
              path: DASHBOARD_ROUTE(),
              render: ({ match }) => (
                <span>{`dashboard ${match.params.objectType}`}</span>
              ),
            },
            {
              path: FULL_SCREEN_ERROR_ROUTE(),
              render: ({ match }) => (
                <span>{`Error Component: ${match.params.code}`}</span>
              ),
            },
          ],
        ),
      ),
    );

    screen.getByText('Error Component: liveStopped');
  });

  it('redirects to the dashboard when user has update permission and live state is stopped', () => {
    mockCanUpdate = true;
    const video = videoMockFactory({
      live_state: liveState.STOPPED,
    });
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <PublicVideoDashboard video={video} playerType="videojs" />,
          [
            {
              path: DASHBOARD_ROUTE(),
              render: ({ match }) => (
                <span>{`dashboard ${match.params.objectType}`}</span>
              ),
            },
            {
              path: FULL_SCREEN_ERROR_ROUTE(),
              render: ({ match }) => (
                <span>{`Error Component: ${match.params.code}`}</span>
              ),
            },
          ],
        ),
      ),
    );

    screen.getByText('dashboard videos');
  });

  it('displays the WaitingLiveVideo component when live is not ready', async () => {
    const video = videoMockFactory({
      live_state: liveState.IDLE,
    });
    useLiveStateStarted.setState({
      isStarted: false,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <PublicVideoDashboard video={video} playerType="videojs" />,
        ),
      ),
    );

    screen.getByRole('heading', {
      name: 'Live is starting',
    });
  });

  it('displays the WaitingLiveVideo component when live_state is IDLE and video is not scheduled', () => {
    const video = videoMockFactory({
      live_state: liveState.IDLE,
      is_scheduled: false,
    });
    useLiveStateStarted.setState({
      isStarted: false,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <PublicVideoDashboard video={video} playerType="videojs" />,
        ),
      ),
    );

    screen.getByRole('heading', {
      name: 'Live is starting',
    });
  });

  it('displays the SubscribeScheduledVideo component when live_state is IDLE and video is scheduled', async () => {
    const startingAt = new Date();
    startingAt.setFullYear(startingAt.getFullYear() + 10);

    const video = videoMockFactory({
      live_state: liveState.IDLE,
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 29, 11, 0, 0)).toISO(),
      is_scheduled: true,
    });
    useLiveStateStarted.setState({
      isStarted: false,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <PublicVideoDashboard video={video} playerType="videojs" />,
        ),
      ),
    );

    await screen.findByRole('button', { name: /register/i });
    screen.getByRole('heading', {
      name: /Live will start in 2 days at 11:00 AM/i,
    });
  });
});
