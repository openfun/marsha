import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { liveState } from 'types/tracks';
import { report } from 'utils/errors/report';
import { videoMockFactory } from 'utils/tests/factories';
import { createPlayer } from './createPlayer';
import { createVideojsPlayer } from './createVideojsPlayer';
jest.mock('jwt-decode', () => {
  return jest.fn().mockImplementation(() => ({
    locale: 'en',
    session_id: 'abcd',
  }));
});

jest.mock('data/appData', () => ({
  appData: {
    flags: {},
    jwt: 'foo',
  },
}));

jest.mock('./createVideojsPlayer');
jest.mock('utils/errors/report');

describe('createPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers('modern');
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    fetchMock.restore();
  });

  it('creates a videojs instance when type player is videojs', () => {
    const ref = 'ref' as any;
    const dispatchPlayerTimeUpdate = jest.fn();
    const video = videoMockFactory();

    createPlayer('videojs', ref, dispatchPlayerTimeUpdate, video);

    expect(createVideojsPlayer).toHaveBeenCalledWith(
      ref,
      dispatchPlayerTimeUpdate,
      video,
    );
  });

  it('reports an error if the player is not implemented', () => {
    const ref = 'ref' as any;
    const dispatchPlayerTimeUpdate = jest.fn();
    const video = videoMockFactory();

    createPlayer('unknown', ref, dispatchPlayerTimeUpdate, video);

    expect(report).toHaveBeenCalledWith(
      Error('player unknown not implemented'),
    );
  });

  it('polls the hls link while it does not exists when in live mode', async () => {
    fetchMock.mock('https://marsha.education/live.m3u8', 404);
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
      urls: {
        manifests: {
          hls: 'https://marsha.education/live.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
    });
    const ref = document.createElement('video');
    const dispatchPlayerTimeUpdate = jest.fn();

    const promise = createPlayer(
      'videojs',
      ref,
      dispatchPlayerTimeUpdate,
      video,
    );

    await waitFor(() => {
      expect(
        fetchMock.calls('https://marsha.education/live.m3u8', {
          method: 'GET',
        }),
      ).toHaveLength(1);
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

    await promise;

    expect(createVideojsPlayer).toHaveBeenCalledWith(
      ref,
      dispatchPlayerTimeUpdate,
      video,
    );
  });
});
