'use strict';

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log');

jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox());
const fetchMock = require('node-fetch');

process.env.CLOUDFRONT_ENDPOINT = 'distribution_id.cloudfront.net';
process.env.CONTAINER_NAME = 'test-marsha-ffmpeg-transmux';
process.env.ECS_CLUSTER = 'test-marsha';
process.env.ECS_TASK_DEFINITION = 'test-marsha-ffmpeg-transmux-definition';
process.env.VPC_SUBNET1 = 'vpc_subnet_1_id';
process.env.VPC_SUBNET2 = 'vpc_subnet_2_id';
process.env.SECURITY_GROUP = 'security_group_id';
process.env.DESTINATION_BUCKET_REGION = 'eu-west-1';
process.env.DESTINATION_BUCKET_NAME = 'test-marsha-destination';
// Mock the AWS SDK calls
const mockDescribeOriginEndpoint = jest.fn();
const mockDeleteOriginEndpoint = jest.fn();
const mockDeleteChannel = jest.fn();
const mockPutObject = jest.fn();
const mockRunTask = jest.fn();
jest.mock('aws-sdk', () => ({
  MediaPackage: function () {
    this.describeOriginEndpoint = mockDescribeOriginEndpoint;
    this.deleteOriginEndpoint = mockDeleteOriginEndpoint;
    this.deleteChannel = mockDeleteChannel;
  },
  S3: function () {
    this.putObject = mockPutObject;
  },
  ECS: function () {
    this.runTask = mockRunTask;
  },
}));

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

  it('receives an event, run FARGATE tasks and upload expected files on destination bucket', async () => {
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
    mockPutObject.mockReturnValue({
      promise: () => Promise.resolve(),
    });

    mockRunTask.mockReturnValue({
      promise: () => Promise.resolve(),
    });

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

    expect(mockRunTask).toHaveBeenCalledWith({
      cluster: 'test-marsha',
      taskDefinition: 'test-marsha-ffmpeg-transmux-definition',
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: ['vpc_subnet_1_id', 'vpc_subnet_2_id'],
          assignPublicIp: 'ENABLED',
          securityGroups: ['security_group_id'],
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: 'test-marsha-ffmpeg-transmux',
            environment: [
              {
                name: 'HLS_MANIFEST_ENDPOINT',
                value:
                  'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_1.m3u8',
              },
              {
                name: 'OUPUT_MP4_FILENAME',
                value: '1610546271_540.mp4',
              },
              {
                name: 'OUTPUT_THUMBNAIL_FILENAME',
                value: '1610546271_540.0000000.jpg',
              },
              {
                name: 'VIDEO_BUCKET_KEY',
                value:
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/mp4/1610546271_540.mp4',
              },
              {
                name: 'THUMBNAIL_BUCKET_KEY',
                value:
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/thumbnails/1610546271_540.0000000.jpg',
              },
              {
                name: 'DESTINATION_BUCKET_REGION',
                value: 'eu-west-1',
              },
              {
                name: 'LAMBDA_FUNCTION_NAME',
                value: 'test-lambda-mediapackage',
              },
              {
                name: 'EXPECTED_FILES_NAME',
                value:
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/expected_files.json',
              },
              {
                name: 'VIDEO_ENDPOINT',
                value:
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/1610546271',
              },
            ],
          },
        ],
      },
    });

    expect(mockRunTask).toHaveBeenCalledWith({
      cluster: 'test-marsha',
      taskDefinition: 'test-marsha-ffmpeg-transmux-definition',
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: ['vpc_subnet_1_id', 'vpc_subnet_2_id'],
          assignPublicIp: 'ENABLED',
          securityGroups: ['security_group_id'],
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: 'test-marsha-ffmpeg-transmux',
            environment: [
              {
                name: 'HLS_MANIFEST_ENDPOINT',
                value:
                  'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_2.m3u8',
              },
              {
                name: 'OUPUT_MP4_FILENAME',
                value: '1610546271_720.mp4',
              },
              {
                name: 'OUTPUT_THUMBNAIL_FILENAME',
                value: '1610546271_720.0000000.jpg',
              },
              {
                name: 'VIDEO_BUCKET_KEY',
                value:
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/mp4/1610546271_720.mp4',
              },
              {
                name: 'THUMBNAIL_BUCKET_KEY',
                value:
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/thumbnails/1610546271_720.0000000.jpg',
              },
              {
                name: 'DESTINATION_BUCKET_REGION',
                value: 'eu-west-1',
              },
              {
                name: 'LAMBDA_FUNCTION_NAME',
                value: 'test-lambda-mediapackage',
              },
              {
                name: 'EXPECTED_FILES_NAME',
                value:
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/expected_files.json',
              },
              {
                name: 'VIDEO_ENDPOINT',
                value:
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/1610546271',
              },
            ],
          },
        ],
      },
    });

    expect(mockPutObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/expected_files.json',
      Body: JSON.stringify({
        resolutions: ['540', '720'],
        files: [
          'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/mp4/1610546271_540.mp4',
          'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/thumbnails/1610546271_540.0000000.jpg',
          'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/mp4/1610546271_720.mp4',
          'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/thumbnails/1610546271_720.0000000.jpg',
        ],
      }),
      ContentType: 'application/json',
    });
  });
});
