import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { useJwt } from 'data/stores/useJwt';
import { useTimedTextTrack } from 'data/stores/useTimedTextTrack';
import { createPlayer } from 'Player/createPlayer';
import { timedTextMode, uploadState } from 'types/tracks';
import { timedTextMockFactory, videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { PublicVODDashboard } from '.';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
}));

jest.mock('Player/createPlayer', () => ({
  createPlayer: jest.fn(),
}));
const mockCreatePlayer = createPlayer as jest.MockedFunction<
  typeof createPlayer
>;

describe('<PublicVODDashboard />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: false,
          },
        } as any),
    });

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
  });
  afterEach(() => {
    fetchMock.restore();
    jest.clearAllMocks();
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

    const { elementContainer: container } = render(
      wrapInVideo(<PublicVODDashboard playerType="videojs" />, video),
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

    const { elementContainer: container } = render(
      wrapInVideo(<PublicVODDashboard playerType="videojs" />, video),
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

    screen.getByText(/Download this video/i);
    screen.getByText('Show a transcript');
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

    const { elementContainer: container } = render(
      wrapInVideo(<PublicVODDashboard playerType="videojs" />, video),
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

    screen.getByText(/Download this video/i);
    screen.getByText('Show a transcript');
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

    expect(container!.querySelector('option[value="ttt-1"]')).not.toBeNull();
  });

  it('redirects to the error component when upload state is deleted', () => {
    const video = videoMockFactory({
      upload_state: uploadState.DELETED,
    });

    render(wrapInVideo(<PublicVODDashboard playerType="videojs" />, video), {
      routerOptions: {
        routes: [
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
      },
    });

    screen.getByText('Error Component: videoDeleted');
  });

  it('redirects to the error component when video has no urls', () => {
    const video = videoMockFactory({
      urls: null,
    });

    render(wrapInVideo(<PublicVODDashboard playerType="videojs" />, video), {
      routerOptions: {
        routes: [
          {
            path: DASHBOARD_ROUTE(),
            render: ({ match }) => (
              <span>{`dashboard ${match.params.objectType}`}</span>
            ),
          },
          {
            path: FULL_SCREEN_ERROR_ROUTE(),
            render: () => <span>{`Error Component`}</span>,
          },
        ],
      },
    });

    screen.getByText('Error Component');
  });
});
