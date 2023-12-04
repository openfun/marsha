import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { videoMockFactory } from 'lib-components/tests';

import { pollForLive } from '.';

describe('createPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
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

    pollForLive(video.urls!, 500);

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

    await waitFor(() => {
      expect(
        fetchMock.calls('https://marsha.education/live.m3u8', {
          method: 'GET',
        }),
      ).toHaveLength(2);
    });
  });
});
