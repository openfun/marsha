process.env.S3_DESTINATION_BUCKET = 'destination bucket';

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log');

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockGetObject = jest.fn();
const mockPutObject = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function() {
    this.getObject = mockGetObject;
    this.putObject = mockPutObject;
  },
}));

const copyDocument = require('./copyDocument');

describe('lambda-encore/src/copyDocument', () => {
  beforeEach(() => {
    console.log.mockReset();
    jest.resetAllMocks();
  });

  it('copy a document from a source to a destination bucket', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise(resolve => resolve({ Body: 'input timed text' })),
    });
    mockPutObject.mockReturnValue({
      promise: () => new Promise(resolve => resolve()),
    });

    await copyDocument('foo/document/foo/bar', 'source bucket')

    expect(mockPutObject).toHaveBeenCalledWith({
      Body: 'input timed text',
      Bucket: 'destination bucket',
      Key: 'foo/document/bar',
      ContentType: 'binary/octet-stream',
    })
  });
})
