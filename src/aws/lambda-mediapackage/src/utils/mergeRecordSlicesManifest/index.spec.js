const endpoint = 'https://example.com/recording-slices-state/';
process.env.CLOUDFRONT_ENDPOINT = 'distribution_id.cloudfront.net';
process.env.DISABLE_SSL_VALIDATION = 'false';
process.env.RECORDING_SLICES_STATE_ENDPOINT = endpoint;
process.env.SHARED_SECRET = 'some secret';
process.env.DESTINATION_BUCKET_NAME = 'test-marsha-destination';

// Mock the AWS SDK calls
const mockPutObject = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function () {
    this.putObject = mockPutObject;
  },
}));

jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox());
const fetchMock = require('node-fetch');

// Use a stub to mock calls to the network
const requestStub = jest.fn();
jest.doMock('request-promise-native', () => requestStub);

const mergeRecordSlicesManifest = require('./');

describe('lambda/mediapackage/src/utils/mergeRecordSlicesManifest()', () => {
  beforeEach(() => {
    // Make sure to reset the modules so we get a chance to alter process.env between tests
    jest.resetModules();

    // Reset the mocks we'll be testing
    requestStub.mockReset();
    fetchMock.mockReset();
    mockPutObject.mockReset();
    // Don't pollute tests with logs intended for CloudWatch
    jest.spyOn(console, 'log').mockImplementation();
  });

  it('merges m3u8 manifests for a single record slice in every resolution and put them in S3', async () => {
    const recording_slices = [
      {
        start: '1642523822',
        stop: '1642523823',
        harvest_job_id:
          'test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1',
        manifest_key:
          'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/slice_1/1610546271_1.m3u8',
        harvested_directory: 'slice_1',
        status: 'harvested',
      },
    ];

    // main manifest slice 1
    fetchMock.get(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/slice_1/1610546271_1.m3u8',
      `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-INDEPENDENT-SEGMENTS
      #EXT-X-STREAM-INF:BANDWIDTH=5364510,AVERAGE-BANDWIDTH=2310036,RESOLUTION=960x540,FRAME-RATE=29.97,CODECS="avc1.640029,mp4a.40.2"
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_1.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=9410222,AVERAGE-BANDWIDTH=4510036,RESOLUTION=1280x720,FRAME-RATE=29.97,CODECS="avc1.640029,mp4a.40.2"
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_2.m3u8`,
    );

    // 540 manifest slice 1
    fetchMock.get(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/slice_1/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_1.m3u8',
      `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:4
      #EXT-X-PLAYLIST-TYPE:EVENT
      #EXT-X-MEDIA-SEQUENCE:2
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_1_2.ts
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_1_3.ts
      #EXT-X-ENDLIST`,
    );

    // 720 manifest slice 1
    fetchMock.get(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/slice_1/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_2.m3u8',
      `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:4
      #EXT-X-PLAYLIST-TYPE:EVENT
      #EXT-X-MEDIA-SEQUENCE:2
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_2_2.ts
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_2_3.ts
      #EXT-X-ENDLIST`,
    );

    mockPutObject.mockReturnValue({
      promise: () => Promise.resolve(),
    });

    const manifest = await mergeRecordSlicesManifest(
      'test',
      'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22',
      '1610546271',
      recording_slices,
    );

    // main manifest merged
    expect(mockPutObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/1610546271.m3u8',
      Body: `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-STREAM-INF:BANDWIDTH=5364510,AVERAGE-BANDWIDTH=2310036,RESOLUTION=960x540,FRAME-RATE=29.97,CODECS="avc1.640029,mp4a.40.2"
test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_540.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=9410222,AVERAGE-BANDWIDTH=4510036,RESOLUTION=1280x720,FRAME-RATE=29.97,CODECS="avc1.640029,mp4a.40.2"
test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_720.m3u8`,
      ContentType: 'text/plain',
    });

    // 540 manifest merged
    expect(mockPutObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_540.m3u8',
      Body: `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:4
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-MEDIA-SEQUENCE:2
#EXTINF:4.000,
slice_1/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_1_2.ts
#EXTINF:4.000,
slice_1/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_1_3.ts
#EXT-X-ENDLIST`,
      ContentType: 'text/plain',
    });

    // 720 manifest merged
    expect(mockPutObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_720.m3u8',
      Body: `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:4
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-MEDIA-SEQUENCE:2
#EXTINF:4.000,
slice_1/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_2_2.ts
#EXTINF:4.000,
slice_1/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_2_3.ts
#EXT-X-ENDLIST`,
      ContentType: 'text/plain',
    });

    expect(manifest).toStrictEqual(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/1610546271.m3u8',
    );
  });

  it('merges m3u8 manifests for all record slices in every resolution and put them in S3', async () => {
    const recording_slices = [
      {
        start: '1642523822',
        stop: '1642523823',
        harvest_job_id:
          'test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1',
        manifest_key:
          'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/slice_1/1610546271_1.m3u8',
        harvested_directory: 'slice_1',
        status: 'harvested',
      },
      {
        start: '1642523824',
        stop: '1642523825',
        harvest_job_id:
          'test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_2',
        manifest_key:
          'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/slice_2/1610546271_2.m3u8',
        harvested_directory: 'slice_2',
        status: 'harvested',
      },
      {
        start: '1642523826',
        stop: '1642523827',
        harvest_job_id:
          'test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_3',
        manifest_key:
          'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/slice_3/1610546271_3.m3u8',
        harvested_directory: 'slice_3',
        status: 'harvested',
      },
    ];

    // main manifest slice 1
    fetchMock.get(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/slice_1/1610546271_1.m3u8',
      `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-INDEPENDENT-SEGMENTS
      #EXT-X-STREAM-INF:BANDWIDTH=5364510,AVERAGE-BANDWIDTH=2310036,RESOLUTION=960x540,FRAME-RATE=29.97,CODECS="avc1.640029,mp4a.40.2"
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_1.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=9410222,AVERAGE-BANDWIDTH=4510036,RESOLUTION=1280x720,FRAME-RATE=29.97,CODECS="avc1.640029,mp4a.40.2"
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_2.m3u8`,
      { delay: 300 },
    );

    // 540 manifest slice 1
    fetchMock.get(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/' +
        'slice_1/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_1.m3u8',
      `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:4
      #EXT-X-PLAYLIST-TYPE:EVENT
      #EXT-X-MEDIA-SEQUENCE:2
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_1_2.ts
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_1_3.ts
      #EXT-X-ENDLIST`,
    );

    // 720 manifest slice 1
    fetchMock.get(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/' +
        'slice_1/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_2.m3u8',
      `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:4
      #EXT-X-PLAYLIST-TYPE:EVENT
      #EXT-X-MEDIA-SEQUENCE:2
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_2_2.ts
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_2_3.ts
      #EXT-X-ENDLIST`,
    );

    // main manifest slice 2
    fetchMock.get(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/slice_2/1610546271_2.m3u8',
      `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-INDEPENDENT-SEGMENTS
      #EXT-X-STREAM-INF:BANDWIDTH=5364510,AVERAGE-BANDWIDTH=2310036,RESOLUTION=960x540,FRAME-RATE=29.97,CODECS="avc1.640029,mp4a.40.2"
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_2_hls_1.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=9410222,AVERAGE-BANDWIDTH=4510036,RESOLUTION=1280x720,FRAME-RATE=29.97,CODECS="avc1.640029,mp4a.40.2"
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_2_hls_2.m3u8`,
      { delay: 100 },
    );

    // 540 manifest slice 2
    fetchMock.get(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/' +
        'slice_2/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_2_hls_1.m3u8',
      `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:4
      #EXT-X-PLAYLIST-TYPE:EVENT
      #EXT-X-MEDIA-SEQUENCE:12
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_2_hls_1_12.ts
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_2_hls_1_13.ts
      #EXT-X-ENDLIST`,
    );

    // 720 manifest slice 2
    fetchMock.get(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/' +
        'slice_2/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_2_hls_2.m3u8',
      `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:4
      #EXT-X-PLAYLIST-TYPE:EVENT
      #EXT-X-MEDIA-SEQUENCE:12
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_2_hls_2_12.ts
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_2_hls_2_13.ts
      #EXT-X-ENDLIST`,
    );

    // main manifest slice 3
    fetchMock.get(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/slice_3/1610546271_3.m3u8',
      `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-INDEPENDENT-SEGMENTS
      #EXT-X-STREAM-INF:BANDWIDTH=5364510,AVERAGE-BANDWIDTH=2310036,RESOLUTION=960x540,FRAME-RATE=29.97,CODECS="avc1.640029,mp4a.40.2"
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_3_hls_1.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=9410222,AVERAGE-BANDWIDTH=4510036,RESOLUTION=1280x720,FRAME-RATE=29.97,CODECS="avc1.640029,mp4a.40.2"
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_3_hls_2.m3u8`,
      { delay: 1000 },
    );

    // 540 manifest slice 3
    fetchMock.get(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/' +
        'slice_3/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_3_hls_1.m3u8',
      `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:4
      #EXT-X-PLAYLIST-TYPE:EVENT
      #EXT-X-MEDIA-SEQUENCE:22
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_3_hls_1_22.ts
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_3_hls_1_23.ts
      #EXT-X-ENDLIST`,
    );

    // 720 manifest slice 3
    fetchMock.get(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/' +
        'slice_3/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_3_hls_2.m3u8',
      `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:4
      #EXT-X-PLAYLIST-TYPE:EVENT
      #EXT-X-MEDIA-SEQUENCE:22
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_3_hls_2_22.ts
      #EXTINF:4.000,
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_3_hls_2_23.ts
      #EXT-X-ENDLIST`,
    );

    mockPutObject.mockReturnValue({
      promise: () => Promise.resolve(),
    });

    const manifest = await mergeRecordSlicesManifest(
      'test',
      'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22',
      '1610546271',
      recording_slices,
    );

    // main manifest merged
    expect(mockPutObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/1610546271.m3u8',
      Body: `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-STREAM-INF:BANDWIDTH=5364510,AVERAGE-BANDWIDTH=2310036,RESOLUTION=960x540,FRAME-RATE=29.97,CODECS="avc1.640029,mp4a.40.2"
test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_540.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=9410222,AVERAGE-BANDWIDTH=4510036,RESOLUTION=1280x720,FRAME-RATE=29.97,CODECS="avc1.640029,mp4a.40.2"
test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_720.m3u8`,
      ContentType: 'text/plain',
    });

    // 540 manifest merged
    expect(mockPutObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_540.m3u8',
      Body: `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:4
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-MEDIA-SEQUENCE:2
#EXTINF:4.000,
slice_1/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_1_2.ts
#EXTINF:4.000,
slice_1/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_1_3.ts
#EXT-X-DISCONTINUITY
#EXT-X-MEDIA-SEQUENCE:12
#EXTINF:4.000,
slice_2/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_2_hls_1_12.ts
#EXTINF:4.000,
slice_2/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_2_hls_1_13.ts
#EXT-X-DISCONTINUITY
#EXT-X-MEDIA-SEQUENCE:22
#EXTINF:4.000,
slice_3/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_3_hls_1_22.ts
#EXTINF:4.000,
slice_3/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_3_hls_1_23.ts
#EXT-X-ENDLIST`,
      ContentType: 'text/plain',
    });

    // 720 manifest merged
    expect(mockPutObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_720.m3u8',
      Body: `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:4
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-MEDIA-SEQUENCE:2
#EXTINF:4.000,
slice_1/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_2_2.ts
#EXTINF:4.000,
slice_1/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_1_hls_2_3.ts
#EXT-X-DISCONTINUITY
#EXT-X-MEDIA-SEQUENCE:12
#EXTINF:4.000,
slice_2/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_2_hls_2_12.ts
#EXTINF:4.000,
slice_2/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_2_hls_2_13.ts
#EXT-X-DISCONTINUITY
#EXT-X-MEDIA-SEQUENCE:22
#EXTINF:4.000,
slice_3/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_3_hls_2_22.ts
#EXTINF:4.000,
slice_3/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_3_hls_2_23.ts
#EXT-X-ENDLIST`,
      ContentType: 'text/plain',
    });

    expect(manifest).toStrictEqual(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/1610546271.m3u8',
    );
  });
});
