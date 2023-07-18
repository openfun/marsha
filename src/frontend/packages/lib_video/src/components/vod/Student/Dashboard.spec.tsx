/* eslint-disable testing-library/no-node-access */
import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  PersistentStore,
  decodeJwt,
  liveState,
  sharedLiveMediaMockFactory,
  timedTextMockFactory,
  timedTextMode,
  useCurrentResourceContext,
  useJwt,
  useSharedLiveMedia,
  useTimedTextTrack,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { createPlayer } from '@lib-video/components/common/Player/createPlayer';
import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

import { Dashboard } from './Dashboard';

const mockVideo = videoMockFactory({
  id: '1234',
});
jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  getResource: jest.fn().mockResolvedValue(null),
  useAppConfig: () => ({
    attendanceDelay: 10000,
    video: mockVideo,
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
  useCurrentResourceContext: jest.fn(),
  decodeJwt: jest.fn(),
}));

jest.mock('utils/websocket', () => ({
  initWebsocket: jest.fn().mockImplementation(() => ({
    addEventListener: () => {},
    close: () => {},
    removeEventListener: () => {},
  })),
}));

jest.mock('components/common/Player/createPlayer', () => ({
  createPlayer: jest.fn(),
}));

jest.mock('components/live/common/ConverseInitializer', () => ({
  ConverseInitializer: ({ children }: { children: React.ReactNode }) => {
    return children;
  },
}));

jest.mock('api/useLiveSessions', () => ({
  useLiveSessionsQuery: jest.fn(),
}));

const mockCreatePlayer = createPlayer as jest.MockedFunction<
  typeof createPlayer
>;

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;
const mockedDecodeJwt = decodeJwt as jest.MockedFunction<typeof decodeJwt>;

describe('<Dashboard />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: false,
          },
        }) as any,
    });

    fetchMock.mock(
      '/api/videos/1234/timedtexttracks/',
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
  });

  afterEach(() => {
    fetchMock.restore();
    jest.clearAllMocks();
  });

  it('displays the video player alone', async () => {
    const video = videoMockFactory({
      ...mockVideo,
      show_download: false,
      has_transcript: false,
      shared_live_medias: [],
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

    const { elementContainer: container } = render(
      <Dashboard playerType="videojs" video={video} socketUrl="some_url" />,
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'videojs',
        expect.any(Element),
        expect.anything(),
        video,
        'en',
        expect.any(Function),
      ),
    );

    expect(
      container!.querySelector('source[src="https://example.com/144p.mp4"]'),
    ).not.toBeNull();
    expect(
      container!.querySelector('source[src="https://example.com/1080p.mp4"]'),
    ).not.toBeNull();
    expect(
      container!.querySelectorAll('source[type="video/mp4"]'),
    ).toHaveLength(2);
    const videoElement = container!.querySelector('video')!;
    expect(videoElement.tabIndex).toEqual(-1);
    expect(videoElement.poster).toEqual(
      'https://example.com/thumbnail/1080p.jpg',
    );
    expect(screen.queryByText('Transcript')).not.toBeInTheDocument();
    expect(screen.queryByText('Download video')).not.toBeInTheDocument();
  });

  it('displays the video player, the download, SharedLiveMedia and transcripts widgets', async () => {
    const timedTextTracks = [
      timedTextMockFactory({
        is_ready_to_show: true,
        mode: timedTextMode.TRANSCRIPT,
      }),
    ];
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: 'Title of the file',
      video: mockVideo.id,
    });
    useTimedTextTrack.getState().addMultipleResources(timedTextTracks);
    useSharedLiveMedia.getState().addResource(mockedSharedLiveMedia);
    const video = videoMockFactory({
      ...mockVideo,
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
      shared_live_medias: [mockedSharedLiveMedia],
    });

    render(
      <Dashboard playerType="videojs" video={video} socketUrl="some_url" />,
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'videojs',
        expect.any(Element),
        expect.anything(),
        video,
        'en',
        expect.any(Function),
      ),
    );

    screen.getByText('Transcripts');
    screen.getByText('Supports sharing');
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
      ...mockVideo,
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

    render(
      <Dashboard playerType="videojs" video={video} socketUrl="some_url" />,
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'videojs',
        expect.any(Element),
        expect.anything(),
        video,
        'en',
        expect.any(Function),
      ),
    );

    screen.getByText('Transcripts');
  });

  it('uses the VideoLayout when the video is a Live-converted VOD', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: { can_update: false },
      },
    ] as any);
    mockedDecodeJwt.mockReturnValue({} as any);

    const video = videoMockFactory({
      ...mockVideo,
      show_download: false,
      has_transcript: false,
      shared_live_medias: [],
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
      live_state: liveState.ENDED,
      xmpp: {
        bosh_url: null,
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        conference_url: 'conference-url',
        jid: 'jid',
        prebind_url: 'prebind_url',
        websocket_url: null,
      },
    });

    const { elementContainer: container } = render(
      <Dashboard playerType="player_type" video={video} socketUrl="some_url" />,
    );

    // Displays video
    const videoElement = container!.querySelector('video')!;
    expect(videoElement.tabIndex).toEqual(-1);

    // Displays Chat and Chat only
    expect(useLivePanelState.getState().isPanelVisible).toEqual(true);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.CHAT,
    ]);
  });
});
