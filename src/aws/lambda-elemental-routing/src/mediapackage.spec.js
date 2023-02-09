'use strict';

process.env.MEDIAPACKAGE_LAMBDA_NAME = 'mediapackage-lambda';

const mockInvoke = jest.fn();
jest.mock('aws-sdk', () => ({
  Lambda: function () {
    this.invoke = mockInvoke;
  },
}));

const mediapackage = require('./mediapackage');

describe('mediapackage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Don't pollute tests with logs intended for CloudWatch
    jest.spyOn(console, 'log').mockImplementation();
  });
  it('invokes the good mediapackage lambda', async () => {
    const event = {
      id: '8f9b8e72-0b31-e883-f19c-aec84742f3ce',
      'detail-type': 'MediaPackage HarvestJob Notification',
      source: 'aws.mediapackage',
      account: 'aws_account_id',
      time: '2019-07-16T17:29:36Z',
      region: 'eu-west-1',
      resources: [
        'arn:aws:mediapackage:eu-west-1:aws_account_id:harvest_jobs/test_762f3681-43dd-446c-81a0-29a6fb6edfe1_1609943219',
      ],
      detail: {
        harvest_job: {
          id: 'test_762f3681-43dd-446c-81a0-29a6fb6edfe1_1609943219',
          arn: 'arn:aws:mediapackage-vod:eu-west-1:aws_account_id:harvest_jobs/test_762f3681-43dd-446c-81a0-29a6fb6edfe1_1609943219',
          status: 'COMPLETED',
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

    mockInvoke.mockReturnValue({
      promise: () => jest.fn(),
    });

    await mediapackage(event);

    expect(mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'test-mediapackage-lambda',
      InvocationType: 'Event',
      Payload: JSON.stringify(event),
    });
  });
});
