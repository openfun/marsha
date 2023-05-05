const fs = require('fs');
const Response = require('node-fetch').Response;
const ReadableStream = require('stream').Readable;
const testDirectory = `${__dirname}/../testfiles/`;
const videoFile = `${testDirectory}big_buck_bunny_1080p.mp4`;

// Mock the AWS SDK calls used in convertClassroomRecording
const mockUpload = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function () {
    this.upload = mockUpload;
  },
}));

jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox());
const fetchMock = require('node-fetch');

const convertClassroomRecording = require('./convertClassroomRecording');

describe('lambda-convert/src/convertClassroomRecording', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Don't pollute tests with logs intended for CloudWatch
    jest.spyOn(console, 'log').mockImplementation();
    fetchMock.mockReset();
    mockUpload.mockReset();
  });

  it('converts uploaded classroom recording', async () => {
    mockUpload.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

    const videoStream = new ReadableStream();
    videoStream.push(fs.readFileSync(videoFile));
    videoStream.push(null);
    fetchMock.mock(
      'https://example.com/recording.mp4',
      new Response(videoStream),
    );

    await convertClassroomRecording(
      'https://example.com/recording.mp4',
      '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/video/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735_fr',
      'source bucket',
    );

    expect(mockUpload).toHaveBeenCalledTimes(1);
  });
});
