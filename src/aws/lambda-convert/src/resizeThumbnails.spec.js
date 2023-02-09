process.env.S3_DESTINATION_BUCKET = 'destination bucket';

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockGetObject = jest.fn();
const mockPutObject = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function () {
    this.getObject = mockGetObject;
    this.putObject = mockPutObject;
  },
}));

const mockGetBufferAsync = jest.fn();
const mockResize = jest.fn();
const mockRead = jest.fn();

jest.mock('jimp', () => ({
  read: mockRead,
}));

const resizeThumbnails = require('./resizeThumbnails');

describe('lambda-convert/src/resizeThumbnails', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Don't pollute tests with logs intended for CloudWatch
    jest.spyOn(console, 'log').mockImplementation();
  });
  it('resizes uploaded image', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise((resolve) => resolve({ Body: 'input timed text' })),
    });
    mockPutObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });
    mockRead.mockReturnValue(
      Promise.resolve({
        resize: mockResize,
      }),
    );
    mockGetBufferAsync.mockReturnValue(Promise.resolve('resized_image'));
    mockResize.mockReturnValue({
      getBufferAsync: mockGetBufferAsync,
    });

    await resizeThumbnails('foo/thumbnail/bar/baz', 'source bucket');

    expect(mockResize).toHaveBeenCalledTimes(5);
    expect(mockGetBufferAsync).toHaveBeenCalledTimes(5);
  });
});
