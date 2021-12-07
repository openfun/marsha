process.env.S3_SOURCE_BUCKET = 'test-marsha-source';
process.env.LAMBDA_CONVERT_NAME = 'test-marsha-convert';

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log');

// Mock the AWS SDK calls used in this migration
const mockListObjects = jest.fn();
const mockInvokeAsync = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function () {
    this.listObjectsV2 = mockListObjects;
  },
  Lambda: function () {
    this.invokeAsync = mockInvokeAsync;
  },
}));

const migration = require('./0001_encode_timed_text_tracks');

describe('0001_encode_timed_text_tracks', () => {
  beforeEach(() => {
    console.log.mockReset();
    jest.resetAllMocks();
  });

  it('runs the migration without pagination', async () => {
    const listObjectsResponse = {
      Contents: [
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/videos/1' },
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/1_st_fr' },
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/2_st_en' },
      ],
      IsTruncated: false,
    };

    mockListObjects.mockReturnValue({
      promise: () => new Promise((resolve) => resolve(listObjectsResponse)),
    });

    mockInvokeAsync.mockReturnValue({
      promise: () => Promise.resolve(),
    });

    await migration();

    expect(mockListObjects).toHaveBeenCalledWith({
      Bucket: 'test-marsha-source',
    });
    expect(mockInvokeAsync).toHaveBeenCalledTimes(2);
    expect(mockInvokeAsync).toHaveBeenCalledWith({
      FunctionName: 'test-marsha-convert',
      InvokeArgs: JSON.stringify({
        Records: [
          {
            s3: {
              object: {
                key:
                  '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/1_st_fr',
              },
              bucket: {
                name: 'test-marsha-source',
              },
            },
          },
        ],
      }),
    });
    expect(mockInvokeAsync).toHaveBeenCalledWith({
      FunctionName: 'test-marsha-convert',
      InvokeArgs: JSON.stringify({
        Records: [
          {
            s3: {
              object: {
                key:
                  '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/2_st_en',
              },
              bucket: {
                name: 'test-marsha-source',
              },
            },
          },
        ],
      }),
    });
  });

  it('runs the migration with pagination', async () => {
    const firstListObjectsResponse = {
      Contents: [
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/videos/1' },
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/1_st_fr' },
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/2_st_en' },
      ],
      IsTruncated: true,
      NextContinuationToken: '80c43d43-4ed0-4695-ac64-8318f59d04ec/videos/2',
    };

    const secondListObjectsResponse = {
      Contents: [
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/videos/2' },
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/3_ts_fr' },
      ],
      IsTruncated: false,
    };

    mockListObjects
      .mockReturnValueOnce({
        promise: () =>
          new Promise((resolve) => resolve(firstListObjectsResponse)),
      })
      .mockReturnValueOnce({
        promise: () =>
          new Promise((resolve) => resolve(secondListObjectsResponse)),
      });

    mockInvokeAsync.mockReturnValue({
      promise: () => Promise.resolve(),
    });

    await migration();

    expect(mockListObjects).toHaveBeenCalledTimes(2);
    expect(mockListObjects).toHaveBeenCalledWith({
      Bucket: 'test-marsha-source',
    });
    expect(mockListObjects).toHaveBeenCalledWith({
      Bucket: 'test-marsha-source',
      ContinuationToken: '80c43d43-4ed0-4695-ac64-8318f59d04ec/videos/2',
    });
    expect(mockInvokeAsync).toHaveBeenCalledTimes(3);
    expect(mockInvokeAsync).toHaveBeenCalledWith({
      FunctionName: 'test-marsha-convert',
      InvokeArgs: JSON.stringify({
        Records: [
          {
            s3: {
              object: {
                key:
                  '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/1_st_fr',
              },
              bucket: {
                name: 'test-marsha-source',
              },
            },
          },
        ],
      }),
    });
    expect(mockInvokeAsync).toHaveBeenCalledWith({
      FunctionName: 'test-marsha-convert',
      InvokeArgs: JSON.stringify({
        Records: [
          {
            s3: {
              object: {
                key:
                  '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/2_st_en',
              },
              bucket: {
                name: 'test-marsha-source',
              },
            },
          },
        ],
      }),
    });
    expect(mockInvokeAsync).toHaveBeenCalledWith({
      FunctionName: 'test-marsha-convert',
      InvokeArgs: JSON.stringify({
        Records: [
          {
            s3: {
              object: {
                key:
                  '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/3_ts_fr',
              },
              bucket: {
                name: 'test-marsha-source',
              },
            },
          },
        ],
      }),
    });
  });
});
