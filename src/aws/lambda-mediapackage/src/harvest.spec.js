'use strict';

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log');

const fs = require('fs');
const child_process = require('child_process');

jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox());
const fetchMock = require('node-fetch');

process.env.CLOUDFRONT_ENDPOINT = 'distribution_id.cloudfront.net';

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockPutObject = jest.fn();
const mockDescribeOriginEndpoint = jest.fn();
const mockDeleteOriginEndpoint = jest.fn();
const mockDeleteChannel = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function () {
    this.putObject = mockPutObject;
  },
  MediaPackage: function () {
    this.describeOriginEndpoint = mockDescribeOriginEndpoint;
    this.deleteOriginEndpoint = mockDeleteOriginEndpoint;
    this.deleteChannel = mockDeleteChannel;
  },
}));

const mockUpdateState = jest.fn();
jest.doMock('update-state', () => mockUpdateState);

jest.mock('fs');
jest.mock('child_process');

const harvest = require('./harvest');
const updateState = require('update-state');

describe('harvest', () => {
  afterEach(() => {
    fetchMock.restore();
    jest.clearAllMocks();
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

  it('transcodes a video', async () => {
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
      dev-manu_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_1.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=9410222,AVERAGE-BANDWIDTH=4510036,RESOLUTION=1280x720,FRAME-RATE=29.970,CODECS="avc1.640029,mp4a.40.2"
      dev-manu_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_2.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=983818,AVERAGE-BANDWIDTH=460543,RESOLUTION=416x236,FRAME-RATE=14.985,CODECS="avc1.4D401E,mp4a.40.2"
      dev-manu_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_3.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=1907215,AVERAGE-BANDWIDTH=845561,RESOLUTION=640x360,FRAME-RATE=29.970,CODECS="avc1.4D401E,mp4a.40.2"
      dev-manu_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_4.m3u8`,
    );

    const mockedExecFile = child_process.execFile.mockImplementation(
      (command, args, options, callback) =>
        callback(null, { stdout: 'ffmpeg ended' }),
    );
    const mockedReadFile = fs.readFile.mockImplementation((path, callback) =>
      callback(null, 'mp4 file content'),
    );
    const mockedUnlink = fs.unlink.mockImplementation((path, callback) =>
      callback(null),
    );

    mockPutObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

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

    await harvest(event);

    const transcodedVideoPath = new RegExp(
      '^/mnt/transcoded_video/[0-9]*_720.mp4$',
    );

    expect(mockedExecFile).toHaveBeenCalledWith(
      'ffmpeg',
      [
        '-i',
        'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/dev-manu_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_2.m3u8',
        '-codec',
        'copy',
        '-f',
        'mp4',
        expect.stringMatching(transcodedVideoPath),
      ],
      { maxBuffer: 104857600 },
      expect.anything(),
    );
    expect(mockedReadFile).toHaveBeenCalledWith(
      expect.stringMatching(transcodedVideoPath),
      expect.anything(),
    );
    expect(mockedUnlink).toHaveBeenCalledWith(
      expect.stringMatching(transcodedVideoPath),
      expect.anything(),
    );

    expect(mockPutObject).toHaveBeenCalledWith({
      Body: 'mp4 file content',
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/mp4/1610546271_720.mp4',
      ContentType: 'video/mp4',
    });

    expect(mockDescribeOriginEndpoint).toHaveBeenCalledWith({
      Id: 'test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls',
    });
    expect(mockDeleteOriginEndpoint).toHaveBeenCalledWith({
      Id: 'mediapackage_endpoint_origin_id',
    });
    expect(mockDeleteChannel).toHaveBeenCalledWith({
      Id: 'mediapackage_channel_id',
    });

    expect(updateState).toHaveBeenCalledWith(
      'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/1610546271',
      'ready',
    );
  });
});
