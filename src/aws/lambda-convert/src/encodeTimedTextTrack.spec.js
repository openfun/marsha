process.env.S3_DESTINATION_BUCKET = 'destination_bucket';

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockGetObject = jest.fn();
const mockPutObject = jest.fn();
const mockCopyObject = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function () {
    this.getObject = mockGetObject;
    this.putObject = mockPutObject;
    this.copyObject = mockCopyObject;
  },
}));

const mockUpdateState = jest.fn();
jest.doMock('update-state', () => mockUpdateState);

const encodeTimedTextTrack = require('./encodeTimedTextTrack');

describe('lambda-convert/src/encodeTimedTextTrack', () => {
  beforeEach(() => {
    mockGetObject.mockReset();
    mockPutObject.mockReset();
    mockCopyObject.mockReset();
  });

  const eol = '\r\n';
  const rawSubstitles = `1${eol}00:00:17,000 --> 00:00:19,000${eol}<script>alert("foo");</script>${eol}${eol}2${eol}00:00:19,750 --> 00:00:23,500${eol}doit être placé entre &lt;script&gt; et &lt;/script&gt;`;

  it('reads the source transcript, parses it, encodes it and then builds it in VTT and writes it to destination', async () => {
    const expectedEncodedSubtitles = `WEBVTT${eol}${eol}1${eol}00:00:17.000 --> 00:00:19.000${eol}&lt;script&gt;alert(&quot;foo&quot;);&lt;/script&gt;${eol}${eol}2${eol}00:00:19.750 --> 00:00:23.500${eol}doit être placé entre &lt;script&gt; et &lt;/script&gt;${eol}${eol}`;

    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise((resolve) =>
          resolve({ Body: { toString: () => rawSubstitles } }),
        ),
    });
    mockPutObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });
    mockCopyObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

    await encodeTimedTextTrack(
      'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr_ts',
      'source_bucket',
      '1605887889_fr_ts',
    );

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: 'source_bucket',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr_ts',
    });
    expect(mockPutObject).toHaveBeenCalledWith({
      Body: expectedEncodedSubtitles,
      Bucket: 'destination_bucket',
      ContentType: 'text/vtt',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtext/1605887889_fr_ts.vtt',
    });
    expect(mockCopyObject).toHaveBeenCalledWith({
      Bucket: 'destination_bucket',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtext/source/1605887889_fr_ts',
      CopySource:
        'source_bucket/a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr_ts',
    });

    expect(mockUpdateState).toHaveBeenCalledWith(
      'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr_ts',
      'ready',
      { extension: 'srt' },
    );
  });

  it('timed text tracks without known mode should be encoded', async () => {
    const expectedEncodedSubtitles = `WEBVTT${eol}${eol}1${eol}00:00:17.000 --> 00:00:19.000${eol}&lt;script&gt;alert(&quot;foo&quot;);&lt;/script&gt;${eol}${eol}2${eol}00:00:19.750 --> 00:00:23.500${eol}doit être placé entre &lt;script&gt; et &lt;/script&gt;${eol}${eol}`;

    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise((resolve) =>
          resolve({ Body: { toString: () => rawSubstitles } }),
        ),
    });
    mockPutObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });
    mockCopyObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

    await encodeTimedTextTrack(
      'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr',
      'source_bucket',
      '1605887889_fr',
    );

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: 'source_bucket',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr',
    });
    expect(mockPutObject).toHaveBeenCalledWith({
      Body: expectedEncodedSubtitles,
      Bucket: 'destination_bucket',
      ContentType: 'text/vtt',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtext/1605887889_fr.vtt',
    });
    expect(mockCopyObject).toHaveBeenCalledWith({
      Bucket: 'destination_bucket',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtext/source/1605887889_fr',
      CopySource:
        'source_bucket/a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr',
    });

    expect(mockUpdateState).toHaveBeenCalledWith(
      'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr',
      'ready',
      { extension: 'srt' },
    );
  });

  it('reads the source timed text, converts it without escaping to VTT and writes it to destination', async () => {
    const expectedEncodedSubtitles = `WEBVTT${eol}${eol}1${eol}00:00:17.000 --> 00:00:19.000${eol}alert("foo");${eol}${eol}2${eol}00:00:19.750 --> 00:00:23.500${eol}doit être placé entre &lt;script&gt; et &lt;/script&gt;${eol}${eol}`;

    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise((resolve) =>
          resolve({ Body: { toString: () => rawSubstitles } }),
        ),
    });
    mockPutObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });
    mockCopyObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

    await encodeTimedTextTrack(
      'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr_st',
      'source_bucket',
      '1605887889_fr_st',
    );

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: 'source_bucket',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr_st',
    });
    expect(mockPutObject).toHaveBeenCalledWith({
      Body: expectedEncodedSubtitles,
      Bucket: 'destination_bucket',
      ContentType: 'text/vtt',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtext/1605887889_fr_st.vtt',
    });
    expect(mockCopyObject).toHaveBeenCalledWith({
      Bucket: 'destination_bucket',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtext/source/1605887889_fr_st',
      CopySource:
        'source_bucket/a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr_st',
    });

    expect(mockUpdateState).toHaveBeenCalledWith(
      'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr',
      'ready',
      { extension: 'srt' },
    );
  });

  it('throws when it fails to convert the source timed text to VTT', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise((resolve) =>
          // no subtitles handler support number.
          resolve({ Body: { toString: () => 42 } }),
        ),
    });

    await encodeTimedTextTrack(
      'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr_st',
      'source_bucket',
      '1605887889_fr_st',
    );

    expect(mockUpdateState).toHaveBeenCalledWith(
      'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr_st',
      'error',
    );
  });

  it('throws when it fails to get the timed text file from the source bucket', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise((resolve, reject) => reject(new Error('Failed!'))),
    });

    await expect(
      encodeTimedTextTrack(
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr_st',
        'source_bucket',
        '1605887889_fr_st',
      ),
    ).rejects.toEqual(new Error('Failed!'));
  });

  it('throws when it fails to put the timed text file to the destination bucket', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise((resolve) =>
          resolve({ Body: { toString: () => rawSubstitles } }),
        ),
    });
    mockPutObject.mockReturnValue({
      promise: () =>
        new Promise((resolve, reject) => reject(new Error('Failed!'))),
    });

    await expect(
      encodeTimedTextTrack(
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfeb9/timedtexttrack/91d397b2-ea37-451c-8d76-8d2f1dd20e4b/1605887889_fr_st',
        'source_bucket',
        '1605887889_fr_st',
      ),
    ).rejects.toEqual(new Error('Failed!'));
  });
});
