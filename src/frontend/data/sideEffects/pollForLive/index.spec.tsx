import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useVideo } from 'data/stores/useVideo';
import { videoMockFactory } from 'utils/tests/factories';
import { pollForLive } from '.';

jest.mock('data/appData', () => ({
  appData: {},
  getDecodedJwt: () => ({}),
}));
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
    pollForLive(video);

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

  it('polls while the video has no manifest', async () => {
    const video = videoMockFactory({ urls: null });
    fetchMock.get(`/api/videos/${video.id}/`, video);

    fetchMock.get('https://marsha.education/live.m3u8', 200);

    pollForLive(video);
    await waitFor(() =>
      expect(fetchMock.calls(`/api/videos/${video.id}/`)).toHaveLength(1),
    );
    expect(useVideo.getState().videos[video.id]).toEqual(video);

    const newDataVideo = {
      ...video,
      urls: {
        manifests: {
          hls: 'https://marsha.education/live.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
    };
    fetchMock.get(`/api/videos/${video.id}/`, newDataVideo, {
      overwriteRoutes: true,
    });

    jest.advanceTimersToNextTimer();
    await waitFor(() =>
      expect(fetchMock.calls(`/api/videos/${video.id}/`)).toHaveLength(2),
    );
    expect(useVideo.getState().videos[video.id]).toEqual(newDataVideo);
    jest.advanceTimersToNextTimer();
    await waitFor(() => {
      expect(
        fetchMock.calls('https://marsha.education/live.m3u8', {
          method: 'GET',
        }),
      ).toHaveLength(1);
    });
  });
});
