'use strict';

// Mock our own sub-modules to simplify our tests
const mockHarvest = jest.fn();
jest.doMock('./src/harvest', () => mockHarvest);

const mockCheck = jest.fn();
jest.doMock('./src/check', () => mockCheck);

const lambda = require('./index.js').handler;

describe('lambda mediapackage', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // Don't pollute tests with logs intended for CloudWatch
    jest.spyOn(console, 'log').mockImplementation();
  });

  it('throws an error when the event type is not managed', async () => {
    const event = {
      id: '81e896e4-d9e5-ec79-f82a-b4cf3246c567',
      'detail-type': 'MediaPackage Input Notification',
      source: 'aws.mediapackage',
      account: 'aws_account_id',
      time: '2019-11-03T21:46:00Z',
      region: 'us-west-2',
      resources: [
        'arn:aws:mediapackage-vod:us-west-2:aws_account_id:assets/asset_id',
        'arn:aws:mediapackage-vod:us-west-2:aws_account_id:packaging_configuration/packaging_configuration_id',
      ],
      detail: {
        event: 'VodAssetPlayable',
        message:
          "Asset 'asset_id' is now playable for PackagingConfiguration 'packaging_configuration_id'",
        packaging_configuration_id: 'packaging_configuration_id',
        manifest_urls: [
          'https://accd64649dc.egress.mediapackage-vod.us-west-2.amazonaws.com/out/v1/b9cc115bf7f1a/b848dfb116920772aa69ba/a3c74b1cae6a451c/index.m3u8',
        ],
      },
    };

    await expect(lambda(event)).rejects.toThrow(
      'type "MediaPackage Input Notification" not managed by this lambda',
    );
  });

  it('executes harvest module', async () => {
    const event = {
      id: '8f9b8e72-0b31-e883-f19c-aec84742f3ce',
      'detail-type': 'MediaPackage HarvestJob Notification',
      source: 'aws.mediapackage',
      account: 'aws_account_id',
      time: '2019-07-16T17:29:36Z',
      region: 'us-east-1',
      resources: [
        'arn:aws:mediapackage:us-east-1:aws_account_id:harvest_jobs/harvest_job_id',
      ],
      detail: {
        harvest_job: {
          id: 'harvest_job_id',
          arn: 'arn:aws:mediapackage-vod:us-east-1:aws_account_id:harvest_jobs/harvest_job_id',
          status: 'SUCCEEDED',
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
    const context = {
      functionName: 'test-lambda-mediapackage',
    };

    await lambda(event, context);

    expect(mockHarvest).toHaveBeenCalledWith(event, 'test-lambda-mediapackage');
  });

  it('executes check module', async () => {
    const event = {
      'detail-type': 'check',
      expectedFilesKey:
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/expected_file.json',
      videoEndpoint:
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/1610458282',
    };

    const context = {
      functionName: 'test-lambda-mediapackage',
      awsRequestId: '7954d4d1-9dd3-47f4-9542-e7fd5f937fe6',
      logGroupName: '/aws/lambda/dev-test-marsha-mediapackage',
    };

    await lambda(event, context);

    expect(mockCheck).toHaveBeenCalledWith(event, context);
  });
});
