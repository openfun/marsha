import { screen, render, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { createPlayer } from 'Player/createPlayer';
import React from 'react';

import { liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { StudentLiveViewerWrapper } from '.';

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
      can_update: false,
    },
  }),
}));

jest.mock('utils/resumeLive', () => ({
  resumeLive: jest.fn().mockResolvedValue(null),
}));
jest.mock('data/sideEffects/getResource', () => ({
  getResource: jest.fn().mockResolvedValue(null),
}));
jest.mock('Player/createPlayer', () => ({
  createPlayer: jest.fn(),
}));

const mockCreatePlayer = createPlayer as jest.MockedFunction<
  typeof createPlayer
>;

describe('<StudentLiveViewerWrapper />', () => {
  beforeEach(() => {
    jest.useFakeTimers('modern');

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
  });

  afterEach(() => {
    fetchMock.restore();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders the player when live is running', async () => {
    fetchMock.mock('https://marsha.education/live.m3u8', 200, {
      overwriteRoutes: true,
    });
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.RUNNING,
      urls: {
        manifests: {
          hls: 'https://marsha.education/live.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
    });

    render(
      wrapInIntlProvider(
        <StudentLiveViewerWrapper video={video} playerType="videojs" />,
      ),
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
  });

  it('renders the advertisment when live is idling', async () => {
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.IDLE,
    });

    render(
      wrapInIntlProvider(
        <StudentLiveViewerWrapper video={video} playerType="videojs" />,
      ),
    );

    screen.getByRole('heading', {
      name: 'Live is starting',
    });
  });

  it('renders the advertisment when live is starting', async () => {
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.STARTING,
    });

    render(
      wrapInIntlProvider(
        <StudentLiveViewerWrapper video={video} playerType="videojs" />,
      ),
    );

    screen.getByRole('heading', {
      name: 'Live is starting',
    });
  });

  it('renders the advertisment until manifest can be fetch', async () => {
    fetchMock.mock('https://marsha.education/live.m3u8', 404);
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.RUNNING,
      urls: {
        manifests: {
          hls: 'https://marsha.education/live.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
    });

    render(
      wrapInIntlProvider(
        <StudentLiveViewerWrapper video={video} playerType="videojs" />,
      ),
    );

    await waitFor(() => {
      expect(
        fetchMock.calls('https://marsha.education/live.m3u8', {
          method: 'GET',
        }),
      ).toHaveLength(1);
    });

    screen.getByRole('heading', {
      name: 'Live is starting',
    });

    fetchMock.mock('https://marsha.education/live.m3u8', 200, {
      overwriteRoutes: true,
    });

    jest.advanceTimersToNextTimer();

    await waitFor(() => {
      expect(
        fetchMock.calls('https://marsha.education/live.m3u8', {
          method: 'GET',
        }),
      ).toHaveLength(2);
    });

    expect(
      screen.queryByRole('heading', {
        name: 'Live is starting',
      }),
    ).not.toBeInTheDocument();
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
  });
});
