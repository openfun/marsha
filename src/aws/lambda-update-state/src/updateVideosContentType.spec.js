// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockCopyObject = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function() {
    this.copyObject = mockCopyObject;
  },
}));

const videos = [
  {
    outputFilePaths: [
      's3://dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_144.mp4',
      's3://dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969053_144.mp4',
    ],
    durationInMs: 20253,
    videoDetails: { widthInPx: 256, heightInPx: 144 },
  },
  {
    outputFilePaths: [
      's3://dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_240.mp4',
    ],
    durationInMs: 20253,
    videoDetails: { widthInPx: 426, heightInPx: 240 },
  },
  {
    outputFilePaths: [
      's3://dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_480.mp4',
    ],
    durationInMs: 20253,
    videoDetails: { widthInPx: 854, heightInPx: 480 },
  },
  {
    outputFilePaths: [
      's3://dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_720.mp4',
    ],
    durationInMs: 20253,
    videoDetails: { widthInPx: 1280, heightInPx: 720 },
  },
  {
    outputFilePaths: [
      's3://dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_1080.mp4',
    ],
    durationInMs: 20253,
    videoDetails: { widthInPx: 1920, heightInPx: 1080 },
  },
];

describe('lambda/update_state/src/updateVideosContentType', () => {
  beforeEach(mockCopyObject.mockReset);

  it('updates every video', async () => {
    const updateVideosContentType = require('./updateVideosContentType');
    mockCopyObject.mockReturnValue({
      promise: () => new Promise(resolve => resolve()),
    });

    await updateVideosContentType(videos);

    expect(mockCopyObject).toBeCalledTimes(6);
    expect(mockCopyObject.mock.calls[0][0]).toEqual({
      Bucket: 'dev-manu-marsha-destination',
      CopySource:
        '/dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_144.mp4',
      Key: '70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_144.mp4',
      ContentType: 'binary/octet-stream',
      MetadataDirective: 'REPLACE',
    });
    expect(mockCopyObject.mock.calls[1][0]).toEqual({
      Bucket: 'dev-manu-marsha-destination',
      CopySource:
        '/dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969053_144.mp4',
      Key: '70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969053_144.mp4',
      ContentType: 'binary/octet-stream',
      MetadataDirective: 'REPLACE',
    });
    expect(mockCopyObject.mock.calls[2][0]).toEqual({
      Bucket: 'dev-manu-marsha-destination',
      CopySource:
        '/dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_240.mp4',
      Key: '70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_240.mp4',
      ContentType: 'binary/octet-stream',
      MetadataDirective: 'REPLACE',
    });
    expect(mockCopyObject.mock.calls[3][0]).toEqual({
      Bucket: 'dev-manu-marsha-destination',
      CopySource:
        '/dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_480.mp4',
      Key: '70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_480.mp4',
      ContentType: 'binary/octet-stream',
      MetadataDirective: 'REPLACE',
    });
    expect(mockCopyObject.mock.calls[4][0]).toEqual({
      Bucket: 'dev-manu-marsha-destination',
      CopySource:
        '/dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_720.mp4',
      Key: '70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_720.mp4',
      ContentType: 'binary/octet-stream',
      MetadataDirective: 'REPLACE',
    });
    expect(mockCopyObject.mock.calls[5][0]).toEqual({
      Bucket: 'dev-manu-marsha-destination',
      CopySource:
        '/dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_1080.mp4',
      Key: '70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_1080.mp4',
      ContentType: 'binary/octet-stream',
      MetadataDirective: 'REPLACE',
    });
  });
});
