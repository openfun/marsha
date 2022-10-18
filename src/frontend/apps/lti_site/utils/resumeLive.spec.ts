import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';

import { getResource } from 'data/sideEffects/getResource';
import { modelName } from 'lib-components';

import { videoMockFactory } from 'lib-components';
import { resumeLive } from './resumeLive';

jest.mock('data/sideEffects/getResource', () => ({
  getResource: jest.fn(),
}));

const mockGetResource = getResource as jest.MockedFunction<typeof getResource>;

describe('resumeLive', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });

    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    fetchMock.restore();
  });
  it('waits until manifest is not ended', async () => {
    const video = videoMockFactory({
      urls: {
        manifests: {
          hls: 'https://c223d9abb67d57c7.mediapackage.eu-west-1.amazonaws.com/out/v1/0a5924bddfff4fe68e8c10a2a671a503/dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
    });
    mockGetResource.mockResolvedValue(video);

    fetchMock.mock(
      'https://c223d9abb67d57c7.mediapackage.eu-west-1.amazonaws.com/out/v1/0a5924bddfff4fe68e8c10a2a671a503/dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls.m3u8',
      `
      #EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-INDEPENDENT-SEGMENTS
      #EXT-X-STREAM-INF:BANDWIDTH=1404480,AVERAGE-BANDWIDTH=1205600,RESOLUTION=854x480,FRAME-RATE=24.000,CODECS="avc1.640029,mp4a.40.2"
      dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_1.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=4440449,AVERAGE-BANDWIDTH=3735564,RESOLUTION=1280x720,FRAME-RATE=24.000,CODECS="avc1.640029,mp4a.40.2"
      dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_2.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=518276,AVERAGE-BANDWIDTH=455345,RESOLUTION=426x240,FRAME-RATE=24.000,CODECS="avc1.4D401E,mp4a.40.2"
      dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_3.m3u8
      `,
    );

    fetchMock.mock(
      'https://c223d9abb67d57c7.mediapackage.eu-west-1.amazonaws.com/out/v1/0a5924bddfff4fe68e8c10a2a671a503/dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_1.m3u8',
      `
      #EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:4
      #EXT-X-MEDIA-SEQUENCE:848
      #EXT-X-DISCONTINUITY-SEQUENCE:21
      #EXTINF:1.500,
      dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_1_848.ts?m=1637050263
      #EXT-X-ENDLIST
      `,
    );

    resumeLive(video);

    await waitFor(() => {
      expect(
        fetchMock.calls(
          'https://c223d9abb67d57c7.mediapackage.eu-west-1.amazonaws.com/out/v1/0a5924bddfff4fe68e8c10a2a671a503/dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls.m3u8',
          {
            method: 'GET',
          },
        ),
      ).toHaveLength(1);
    });
    expect(mockGetResource).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(
        fetchMock.calls(
          'https://c223d9abb67d57c7.mediapackage.eu-west-1.amazonaws.com/out/v1/0a5924bddfff4fe68e8c10a2a671a503/dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_1.m3u8',
          {
            method: 'GET',
          },
        ),
      ).toHaveLength(1);
    });
    expect(mockGetResource).not.toHaveBeenCalled();

    jest.advanceTimersToNextTimer();

    await waitFor(() => {
      expect(
        fetchMock.calls(
          'https://c223d9abb67d57c7.mediapackage.eu-west-1.amazonaws.com/out/v1/0a5924bddfff4fe68e8c10a2a671a503/dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_1.m3u8',
          {
            method: 'GET',
          },
        ),
      ).toHaveLength(2);
    });
    expect(mockGetResource).not.toHaveBeenCalled();

    fetchMock.mock(
      'https://c223d9abb67d57c7.mediapackage.eu-west-1.amazonaws.com/out/v1/0a5924bddfff4fe68e8c10a2a671a503/dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_1.m3u8',
      `
      #EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:4
      #EXT-X-MEDIA-SEQUENCE:848
      #EXT-X-DISCONTINUITY-SEQUENCE:21
      #EXTINF:1.500,
      dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_1_848.ts?m=1637050263
      `,
      {
        overwriteRoutes: true,
      },
    );

    jest.advanceTimersToNextTimer();

    await waitFor(() => {
      expect(mockGetResource).toHaveBeenCalledWith(modelName.VIDEOS, video.id);
    });
  });
});
