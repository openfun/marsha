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

const encodeTimedTextTrack = require('./encodeTimedTextTrack');

describe('lambda-encode/src/encodeTimedTextTrack', () => {
  beforeEach(() => {
    mockGetObject.mockReset();
    mockPutObject.mockReset();
  });

  it('reads the source timed text, converts it to VTT and writes it to destination', async () => {
    const eol = '\r\n';
    const rawSubstitles = `1${eol}00:00:17,000 --> 00:00:19,000${eol}<script>alert("foo");</script>${eol}${eol}2${eol}00:00:19,750 --> 00:00:23,500${eol}doit être placé entre &lt;script&gt; et &lt;/script&gt;`;
    const expectedEncodedSubtitles = `WEBVTT${eol}${eol}1${eol}00:00:17.000 --> 00:00:19.000${eol}&lt;script&gt;alert(&quot;foo&quot;);&lt;/script&gt;${eol}${eol}2${eol}00:00:19.750 --> 00:00:23.500${eol}doit être placé entre &lt;script&gt; et &lt;/script&gt;${eol}${eol}`;

    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise(resolve =>
          resolve({ Body: { toString: () => rawSubstitles } }),
        ),
    });
    mockPutObject.mockReturnValue({
      promise: () => new Promise(resolve => resolve()),
    });

    await encodeTimedTextTrack('some key', 'source bucket');

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: 'source bucket',
      Key: 'some key',
    });
    expect(mockPutObject).toHaveBeenCalledWith({
      Body: expectedEncodedSubtitles,
      Bucket: 'destination bucket',
      Key: 'some key.vtt',
    });
  });

  it('throws when it fails to convert the source timed text to VTT', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise(resolve =>
          // no subtitles handler support number.
          resolve({ Body: { toString: () => 42 } }),
        ),
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

    await expect(
      encodeTimedTextTrack('some key', 'source bucket'),
    ).rejects.toEqual(new Error('Failed!'));
  });
});
