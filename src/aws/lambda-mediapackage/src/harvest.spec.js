'use strict';

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log');

const fs = require('fs');
const os = require('os');

jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox());
const fetchMock = require('node-fetch');

process.env.CLOUDFRONT_ENDPOINT = 'distribution_id.cloudfront.net';
process.env.CHUNK_DURATION = '1200';

// Mock the AWS SDK calls
const mockDescribeOriginEndpoint = jest.fn();
const mockDeleteOriginEndpoint = jest.fn();
const mockDeleteChannel = jest.fn();
const mockInvoke = jest.fn();
jest.mock('aws-sdk', () => ({
  MediaPackage: function () {
    this.describeOriginEndpoint = mockDescribeOriginEndpoint;
    this.deleteOriginEndpoint = mockDeleteOriginEndpoint;
    this.deleteChannel = mockDeleteChannel;
  },
  Lambda: function () {
    this.invoke = mockInvoke;
  },
}));

jest.mock('fs');

const harvest = require('./harvest');

describe('harvest', () => {
  beforeEach(() => {
    console.log.mockReset();
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('throws an error when the job status is not succeeded', async () => {
    const event = {
      id: '8f9b8e72-0b31-e883-f19c-aec84742f3ce',
      'detail-type': 'MediaPackage HarvestJob Notification',
      source: 'aws.mediapackage',
      account: 'aws_account_id',
      time: '2019-07-16T17:29:36Z',
      region: 'eu-west-1',
      resources: [
        'arn:aws:mediapackage:eu-west-1:aws_account_id:harvest_jobs/harvest_job_id',
      ],
      detail: {
        harvest_job: {
          id: 'harvest_job_id',
          arn:
            'arn:aws:mediapackage-vod:eu-west-1:aws_account_id:harvest_jobs/harvest_job_id',
          status: 'STARTING',
          origin_endpoint_id: 'endpoint_id',
          start_time: '2019-06-26T20:30:00-08:00',
          end_time: '2019-06-26T21:00:00-08:00',
          s3_destination: {
            bucket_name: 's3_bucket_name',
            manifest_key: 'path/and/manifest_name/index.m3u8',
            role_arn: 'arn:aws:iam::aws_account_id:role/S3Access_role',
          },
          created_at: '2019-06-26T21:03:12-08:00',
        },
      },
    };

    await expect(harvest(event)).rejects.toThrow(
      'harvest jos status is not SUCCEEDED. Current status: STARTING',
    );
  });

  it('receives an event and invoke the lambda', async () => {
    const event = {
      id: '8f9b8e72-0b31-e883-f19c-aec84742f3ce',
      'detail-type': 'MediaPackage HarvestJob Notification',
      source: 'aws.mediapackage',
      account: 'aws_account_id',
      time: '2019-07-16T17:29:36Z',
      region: 'eu-west-1',
      resources: [
        'arn:aws:mediapackage:eu-west-1:aws_account_id:harvest_jobs/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271',
      ],
      detail: {
        harvest_job: {
          id: 'test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271',
          arn:
            'arn:aws:mediapackage-vod:eu-west-1:aws_account_id:harvest_jobs/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271',
          status: 'SUCCEEDED',
          origin_endpoint_id:
            'test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls',
          start_time: '2019-06-26T20:30:00-08:00',
          end_time: '2019-06-26T21:00:00-08:00',
          s3_destination: {
            bucket_name: 'test-marsha-destination',
            manifest_key:
              'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/1610546271.m3u8',
            role_arn: 'arn:aws:iam::aws_account_id:role/S3Access_role',
          },
          created_at:
            'arn:aws:iam::aws_account_id:role/test-marsha-mediapackage-harvest-job-s3-role',
        },
      },
    };

    fetchMock.get(
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/1610546271.m3u8',
      `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-INDEPENDENT-SEGMENTS
      #EXT-X-STREAM-INF:BANDWIDTH=5364510,AVERAGE-BANDWIDTH=2310036,RESOLUTION=960x540,FRAME-RATE=29.970,CODECS="avc1.640029,mp4a.40.2"
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_1.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=9410222,AVERAGE-BANDWIDTH=4510036,RESOLUTION=1280x720,FRAME-RATE=29.970,CODECS="avc1.640029,mp4a.40.2"
      test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_2.m3u8`,
    );

    mockDescribeOriginEndpoint.mockReturnValue({
      promise: () =>
        Promise.resolve({
          Id: 'mediapackage_endpoint_origin_id',
          ChannelId: 'mediapackage_channel_id',
        }),
    });
    mockDeleteOriginEndpoint.mockReturnValue({
      promise: () => Promise.resolve(),
    });
    mockDeleteChannel.mockReturnValue({
      promise: () => Promise.resolve(),
    });
    mockInvoke.mockReturnValue({
      promise: () => Promise.resolve(),
    });

    const mockedRmdir = fs.rmdir.mockImplementation((path, options, callback) =>
      callback(null),
    );
    const mockedMkdir = fs.mkdir.mockImplementation((path, options, callback) =>
      callback(null, true),
    );
    const mockedOpenResolution = fs.open.mockImplementationOnce(
      (path, flags, callback) => callback(null, 'resolution-fd'),
    );
    const mockedOpenList = fs.open.mockImplementation((path, flags, callback) =>
      callback(null, 'list-fd'),
    );
    const mockedWrite = fs.write.mockImplementation((fd, data, callback) =>
      callback(null),
    );
    const mockedClose = fs.close.mockImplementation((fd, callback) =>
      callback(null),
    );

    await harvest(event, 'test-lambda-mediapackage');

    expect(mockDescribeOriginEndpoint).toHaveBeenCalledWith({
      Id: 'test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls',
    });
    expect(mockDeleteOriginEndpoint).toHaveBeenCalledWith({
      Id: 'mediapackage_endpoint_origin_id',
    });
    expect(mockDeleteChannel).toHaveBeenCalledWith({
      Id: 'mediapackage_channel_id',
    });

    expect(mockedRmdir).toHaveBeenCalledWith(
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22',
      { recursive: true },
      expect.anything(),
    );
    expect(mockedMkdir).toHaveBeenNthCalledWith(
      1,
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22',
      { recursive: true },
      expect.anything(),
    );
    expect(mockedOpenResolution).toHaveBeenCalledWith(
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/resolutions.txt',
      'w',
      expect.anything(),
    );

    // 540p
    expect(mockedMkdir).toHaveBeenCalledWith(
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/540',
      { recursive: true },
      expect.anything(),
    );
    expect(mockedWrite).toHaveBeenCalledWith(
      'resolution-fd',
      `/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/540/list.txt${os.EOL}`,
      expect.anything(),
    );
    expect(mockedOpenList).toHaveBeenCalledWith(
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/540/list.txt',
      'w',
      expect.anything(),
    );
    //540p, first chunk
    expect(mockedWrite).toHaveBeenCalledWith(
      'list-fd',
      `file '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/540/fragment0.mp4'${os.EOL}`,
      expect.anything(),
    );
    expect(mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'test-lambda-mediapackage',
      InvocationType: 'Event',
      Payload: JSON.stringify({
        'detail-type': 'transmux',
        resolution: 540,
        playlistUri:
          'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_1.m3u8',
        transmuxedVideoChunkFilename:
          '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/540/fragment0.mp4',
        from: 0,
        to: 1200,
        destinationBucketName: 'test-marsha-destination',
        videoId: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22',
        videoStamp: '1610546271',
        resolutionsFilePath:
          '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/resolutions.txt',
        resolutionListPath:
          '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/540/list.txt',
      }),
    });
    //540p, second chunk
    expect(mockedWrite).toHaveBeenCalledWith(
      'list-fd',
      `file '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/540/fragment1.mp4'${os.EOL}`,
      expect.anything(),
    );
    expect(mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'test-lambda-mediapackage',
      InvocationType: 'Event',
      Payload: JSON.stringify({
        'detail-type': 'transmux',
        resolution: 540,
        playlistUri:
          'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_1.m3u8',
        transmuxedVideoChunkFilename:
          '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/540/fragment1.mp4',
        from: 1200,
        to: 1800,
        destinationBucketName: 'test-marsha-destination',
        videoId: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22',
        videoStamp: '1610546271',
        resolutionsFilePath:
          '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/resolutions.txt',
        resolutionListPath:
          '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/540/list.txt',
      }),
    });

    expect(mockedClose).toHaveBeenCalledWith('list-fd', expect.anything());

    // 720p
    expect(mockedMkdir).toHaveBeenCalledWith(
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720',
      { recursive: true },
      expect.anything(),
    );
    expect(mockedWrite).toHaveBeenCalledWith(
      'resolution-fd',
      `/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/list.txt${os.EOL}`,
      expect.anything(),
    );
    expect(mockedOpenList).toHaveBeenCalledWith(
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/list.txt',
      'w',
      expect.anything(),
    );
    //720p, first chunk
    expect(mockedWrite).toHaveBeenCalledWith(
      'list-fd',
      `file '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/fragment0.mp4'${os.EOL}`,
      expect.anything(),
    );
    expect(mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'test-lambda-mediapackage',
      InvocationType: 'Event',
      Payload: JSON.stringify({
        'detail-type': 'transmux',
        resolution: 720,
        playlistUri:
          'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_2.m3u8',
        transmuxedVideoChunkFilename:
          '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/fragment0.mp4',
        from: 0,
        to: 1200,
        destinationBucketName: 'test-marsha-destination',
        videoId: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22',
        videoStamp: '1610546271',
        resolutionsFilePath:
          '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/resolutions.txt',
        resolutionListPath:
          '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/list.txt',
      }),
    });
    // 720p, second chunk
    expect(mockedWrite).toHaveBeenCalledWith(
      'list-fd',
      `file '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/fragment1.mp4'${os.EOL}`,
      expect.anything(),
    );
    expect(mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'test-lambda-mediapackage',
      InvocationType: 'Event',
      Payload: JSON.stringify({
        'detail-type': 'transmux',
        resolution: 720,
        playlistUri:
          'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_2.m3u8',
        transmuxedVideoChunkFilename:
          '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/fragment1.mp4',
        from: 1200,
        to: 1800,
        destinationBucketName: 'test-marsha-destination',
        videoId: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22',
        videoStamp: '1610546271',
        resolutionsFilePath:
          '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/resolutions.txt',
        resolutionListPath:
          '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/list.txt',
      }),
    });

    expect(mockedClose).toHaveBeenCalledWith('list-fd', expect.anything());

    expect(mockedClose).toHaveBeenCalledWith(
      'resolution-fd',
      expect.anything(),
    );
  });
});
