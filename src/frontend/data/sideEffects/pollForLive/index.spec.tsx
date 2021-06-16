import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';

import { videoMockFactory } from '../../../utils/tests/factories';
import { pollForLive } from '.';

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

  it('polls while the manifest is not available', async () => {
    fetchMock.mock('https://marsha.education/live.m3u8', 404);
    const video = videoMockFactory({
      urls: {
        manifests: {
          hls: 'https://marsha.education/live.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
    });

    pollForLive(video.urls!);

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
  });
});
