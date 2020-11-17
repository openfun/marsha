process.env.S3_DESTINATION_BUCKET = 'destination_bucket';

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockGetObject = jest.fn();
const mockPutObject = jest.fn();
const mockCopyObject = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function() {
    this.getObject = mockGetObject;
    this.putObject = mockPutObject;
    this.copyObject = mockCopyObject;
  },
}));

const encodeTimedTextTrack = require('./encodeTimedTextTrack');

describe('lambda-encode/src/encodeTimedTextTrack', () => {
  beforeEach(() => {
    mockGetObject.mockReset();
    mockPutObject.mockReset();
  });

  const eol = '\r\n';
  const rawSubstitles = `1${eol}00:00:17,000 --> 00:00:19,000${eol}<script>alert("foo");</script>${eol}${eol}2${eol}00:00:19,750 --> 00:00:23,500${eol}doit être placé entre &lt;script&gt; et &lt;/script&gt;`;

  it('reads the source transcript, parses it, encodes it and then builds it in VTT and writes it to destination', async () => {
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
    mockCopyObject.mockReturnValue({
      promise: () => new Promise(resolve => resolve()),
    });

    const extension = await encodeTimedTextTrack('uuid/timedtexttrack/some_key', 'source_bucket', '1557479487_ar_ts');

    expect(extension).toEqual("srt");

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: 'source_bucket',
      Key: 'uuid/timedtexttrack/some_key',
    });
    expect(mockPutObject).toHaveBeenCalledWith({
      Body: expectedEncodedSubtitles,
      Bucket: 'destination_bucket',
      ContentType: 'text/vtt',
      Key: 'uuid/timedtext/some_key.vtt'
    });
    expect(mockCopyObject).toHaveBeenCalledWith({
      Bucket: 'destination_bucket',
      Key: 'uuid/timedtext/source/some_key',
      CopySource: 'source_bucket/uuid/timedtexttrack/some_key'
    });
  });

  it('timed text tracks without known mode should be encoded', async () => {
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

    await encodeTimedTextTrack('/timedtexttrack/some_key', 'source_bucket', '1557479487_ar');

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: 'source_bucket',
      Key: '/timedtexttrack/some_key',
    });
    expect(mockPutObject).toHaveBeenCalledWith({
      Body: expectedEncodedSubtitles,
      Bucket: 'destination_bucket',
      ContentType: 'text/vtt',
      Key: '/timedtext/some_key.vtt'
    });
  });

  it('reads the source timed text, converts it without escaping to VTT and writes it to destination', async () => {
    const expectedEncodedSubtitles = `WEBVTT${eol}${eol}1${eol}00:00:17.000 --> 00:00:19.000${eol}alert("foo");${eol}${eol}2${eol}00:00:19.750 --> 00:00:23.500${eol}doit être placé entre &lt;script&gt; et &lt;/script&gt;${eol}${eol}`;

    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise(resolve =>
          resolve({ Body: { toString: () => rawSubstitles } }),
        ),
    });
    mockPutObject.mockReturnValue({
      promise: () => new Promise(resolve => resolve()),
    });

    await encodeTimedTextTrack('/timedtexttrack/some_key', 'source_bucket', '1557479487_ar_st');

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: 'source_bucket',
      Key: '/timedtexttrack/some_key',
    });
    expect(mockPutObject).toHaveBeenCalledWith({
      Body: expectedEncodedSubtitles,
      Bucket: 'destination_bucket',
      ContentType: 'text/vtt',
      Key: '/timedtext/some_key.vtt'
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
      encodeTimedTextTrack('/timedtexttrack/some_key', 'source_bucket', '1557479487_ar_st'),
    ).rejects.toEqual(new Error('Invalid timed text format for /timedtexttrack/some_key.'));
  });

  it('throws when it fails to get the timed text file from the source bucket', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise((resolve, reject) => reject(new Error('Failed!'))),
    });

    await expect(
      encodeTimedTextTrack('/timedtexttrack/some_key', 'source_bucket', '1557479487_ar_st'),
    ).rejects.toEqual(new Error('Failed!'));
  });

  it('throws when it fails to put the timed text file to the destination bucket', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise(resolve =>
          resolve({ Body: { toString: () => rawSubstitles } }),
        ),
    });
    mockPutObject.mockReturnValue({
      promise: () =>
        new Promise((resolve, reject) => reject(new Error('Failed!'))),
    });

    await expect(
      encodeTimedTextTrack('/timedtexttrack/some_key', 'source_bucket', '1557479487_ar_st'),
    ).rejects.toEqual(new Error('Failed!'));
  });
});
