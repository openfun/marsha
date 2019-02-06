process.env.S3_DESTINATION_BUCKET = 'destination bucket';

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockGetObject = jest.fn();
const mockPutObject = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function() {
    this.getObject = mockGetObject;
    this.putObject = mockPutObject;
  },
}));

// Mock subsrt so we avoid line break issues between \n and \r\n
const mockSubsrt = { convert: jest.fn() };
jest.mock('@openfun/subsrt', () => mockSubsrt);

const encodeTimedTextTrack = require('./encodeTimedTextTrack');

describe('lambda-encode/src/encodeTimedTextTrack', () => {
  beforeEach(() => {
    mockGetObject.mockReset();
    mockPutObject.mockReset();
    mockSubsrt.convert.mockReset();
  });

  it('reads the source timed text, converts it to VTT and writes it to destination', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise(resolve =>
          resolve({ Body: { toString: () => 'input timed text' } }),
        ),
    });
    mockPutObject.mockReturnValue({
      promise: () => new Promise(resolve => resolve()),
    });
    mockSubsrt.convert.mockReturnValue('output timed text');

    await encodeTimedTextTrack('some key', 'source bucket');

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: 'source bucket',
      Key: 'some key',
    });
    expect(mockPutObject).toHaveBeenCalledWith({
      Body: 'output timed text',
      Bucket: 'destination bucket',
      Key: 'some key.vtt',
    });
    expect(mockSubsrt.convert).toHaveBeenCalledWith('input timed text', {
      format: 'vtt',
    });
  });

  it('throws when it fails to convert the source timed text to VTT', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise(resolve =>
          resolve({ Body: { toString: () => 'input invalid timed text' } }),
        ),
    });
    mockSubsrt.convert.mockImplementation(() => {
      throw new Error('Failed!');
    });

    await expect(
      encodeTimedTextTrack('some key', 'source bucket'),
    ).rejects.toEqual(new Error('Invalid timed text format for some key.'));
  });

  it('throws when it fails to get the timed text file from the source bucket', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise((resolve, reject) => reject(new Error('Failed!'))),
    });

    await expect(
      encodeTimedTextTrack('some key', 'source bucket'),
    ).rejects.toEqual(new Error('Failed!'));
  });

  it('throws when it fails to put the timed text file to the destination bucket', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise(resolve =>
          resolve({ Body: { toString: () => 'input timed text' } }),
        ),
    });
    mockPutObject.mockReturnValue({
      promise: () =>
        new Promise((resolve, reject) => reject(new Error('Failed!'))),
    });
    mockSubsrt.convert.mockReturnValue('output timed text');

    await expect(
      encodeTimedTextTrack('some key', 'source bucket'),
    ).rejects.toEqual(new Error('Failed!'));
  });
});
