process.env.S3_SOURCE_BUCKET = 'test-marsha-source';
process.env.LAMBDA_ENCODE_NAME = 'test-marsha-encode';

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log');

// Mock the AWS SDK calls used in this migration
const mockListObjects = jest.fn();
const mockInvokeAsync = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function() {
    this.listObjects = mockListObjects;
  },
  Lambda: function() {
    this.invokeAsync = mockInvokeAsync
  },
}));

const migration = require('./0001_encode_timed_text_tracks');

describe('0001_encode_timed_text_tracks', () => {

  beforeEach(() => {
    console.log.mockReset();
    jest.resetAllMocks();
  });

  it('runs the migration without pagination', () => {
    const listObjectsResponse = {
      Contents: [
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/videos/1' },
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/1_st_fr' },
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/2_st_en'},
      ],
      IsTruncated: false,
    }
    let expectedCallback;
    mockListObjects.mockImplementation((parameters, callback) => {
      expectedCallback = callback;
      callback(null, listObjectsResponse);
    });

    mockInvokeAsync.mockReturnValue({
      send: jest.fn(),
    });

    migration();

    expect(mockListObjects).toHaveBeenCalledWith({ Bucket: 'test-marsha-source' }, expectedCallback);
    expect(mockInvokeAsync).toHaveBeenCalledTimes(2);
    expect(mockInvokeAsync).toHaveBeenCalledWith({
      FunctionName: 'test-marsha-encode',
      InvokeArgs: {
        Records: [{
          s3: {
            object: {key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/1_st_fr'},
            bucket: {
              name: 'test-marsha-source'
            },
          },
        }]
      },
    });
    expect(mockInvokeAsync).toHaveBeenCalledWith({
      FunctionName: 'test-marsha-encode',
      InvokeArgs: {
        Records: [{
          s3: {
            object: {key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/2_st_en'},
            bucket: {
              name: 'test-marsha-source'
            },
          },
        }]
      },
    });
  });

  it('runs the migration with pagination', () => {
    const firstListObjectsResponse = {
      Contents: [
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/videos/1' },
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/1_st_fr' },
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/2_st_en'},
      ],
      IsTruncated: true,
      NextMarker: '80c43d43-4ed0-4695-ac64-8318f59d04ec/videos/2'
    }

    const secondListObjectsResponse = {
      Contents: [
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/videos/2' },
        { Key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/3_ts_fr' },
      ],
      IsTruncated: false,
    }

    let expectedCallback1;
    let expectedCallback2;
    mockListObjects.mockImplementationOnce((parameters, callback) => {
      expectedCallback1 = callback;
      callback(null, firstListObjectsResponse);
    }).mockImplementationOnce((parameters, callback) => {
      expectedCallback2 = callback;
      callback(null, secondListObjectsResponse);
    });;

    mockInvokeAsync.mockReturnValue({
      send: jest.fn(),
    });

    migration();

    expect(mockListObjects).toHaveBeenCalledTimes(2);
    expect(mockListObjects).toHaveBeenCalledWith({ Bucket: 'test-marsha-source' }, expectedCallback1);
    expect(mockListObjects).toHaveBeenCalledWith({
      Bucket: 'test-marsha-source',
      Marker: '80c43d43-4ed0-4695-ac64-8318f59d04ec/videos/2'
    }, expectedCallback2);
    expect(mockInvokeAsync).toHaveBeenCalledTimes(3);
    expect(mockInvokeAsync).toHaveBeenCalledWith({
      FunctionName: 'test-marsha-encode',
      InvokeArgs: {
        Records: [{
          s3: {
            object: {key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/1_st_fr'},
            bucket: {
              name: 'test-marsha-source'
            },
          },
        }]
      },
    });
    expect(mockInvokeAsync).toHaveBeenCalledWith({
      FunctionName: 'test-marsha-encode',
      InvokeArgs: {
        Records: [{
          s3: {
            object: {key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/2_st_en'},
            bucket: {
              name: 'test-marsha-source'
            },
          },
        }]
      },
    });
    expect(mockInvokeAsync).toHaveBeenCalledWith({
      FunctionName: 'test-marsha-encode',
      InvokeArgs: {
        Records: [{
          s3: {
            object: {key: '80c43d43-4ed0-4695-ac64-8318f59d04ec/timedtexttrack/3_ts_fr'},
            bucket: {
              name: 'test-marsha-source'
            },
          },
        }]
      },
    });
  });
});
