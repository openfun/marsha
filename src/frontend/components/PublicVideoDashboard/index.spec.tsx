import React from 'react';
import fetchMock from 'fetch-mock';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { ImportMock } from 'ts-mock-imports';

import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import * as useTimedTextTrackModule from '../../data/stores/useTimedTextTrack';
import { liveState, timedTextMode } from '../../types/tracks';
import { converseMounter } from '../../utils/converse';
import {
  timedTextMockFactory,
  videoMockFactory,
} from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import { createPlayer } from '../../Player/createPlayer';
import PublicVideoDashboard from '.';

jest.mock('../../Player/createPlayer', () => ({
  createPlayer: jest.fn(),
}));
jest.mock('../../data/sideEffects/getResource', () => ({
  getResource: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../data/sideEffects/pollForLive', () => ({
  pollForLive: jest.fn().mockResolvedValue(null),
}));

const mockCreatePlayer = createPlayer as jest.MockedFunction<
  typeof createPlayer
>;

const mockVideo = videoMockFactory();
jest.mock('../../data/appData', () => ({
  appData: {
    video: mockVideo,
  },
}));

const useTimedTextTrackStub = ImportMock.mockFunction(
  useTimedTextTrackModule,
  'useTimedTextTrack',
);

jest.mock('../../utils/converse', () => ({
  converseMounter: jest.fn(() => jest.fn()),
}));

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
    mockCreatePlayer.mockResolvedValue({
      destroy: jest.fn(),
    });
  });

  afterEach(() => {
    fetchMock.restore();
    jest.clearAllMocks();
  });
  it('displays the video player alone', async () => {
    useTimedTextTrackStub.returns([]);
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
    useTimedTextTrackStub.returns(timedTextTracks);
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
    useTimedTextTrackStub.returns(timedTextTracks);
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
  it('displays the video player and the chat', async () => {
    useTimedTextTrackStub.returns([]);
    const video = videoMockFactory({
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
    expect(container.querySelector('#converse-container')).toBeInTheDocument();
  });

  it('redirects to the error component when live state is stopped or stopping', () => {
    [liveState.STOPPED, liveState.STOPPING].forEach((state) => {
      const video = videoMockFactory({
        live_state: state,
      });
      render(
        wrapInIntlProvider(
          wrapInRouter(
            <PublicVideoDashboard video={video} playerType="videojs" />,
            [
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

      screen.getByText('Error Component: notFound');

      cleanup();
    });
  });

  it('displays the WaitingLiveVideo component when live is not ready', () => {
    [liveState.IDLE, liveState.CREATING, liveState.STARTING].forEach(
      (state) => {
        const video = videoMockFactory({
          live_state: state,
        });
        render(
          wrapInIntlProvider(
            wrapInRouter(
              <PublicVideoDashboard video={video} playerType="videojs" />,
            ),
          ),
        );

        screen.getByText('Live will begin soon');
        screen.getByText(
          'The live is going to start. You can wait here, the player will start once the live is ready.',
        );

        cleanup();
      },
    );
  });
});
