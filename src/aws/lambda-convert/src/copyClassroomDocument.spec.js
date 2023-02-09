process.env.S3_DESTINATION_BUCKET = 'destination_bucket';

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockCopyObject = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function () {
    this.copyObject = mockCopyObject;
  },
}));

const copyClassroomDocument = require('./copyClassroomDocument');

describe('lambda-encore/src/copyClassroomDocument', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Don't pollute tests with logs intended for CloudWatch
    jest.spyOn(console, 'log').mockImplementation();
  });

  it('copy a classroom document from a source to a destination bucket', async () => {
    mockCopyObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

    await copyClassroomDocument(
      'a3e213a7-9c56-4bd3-b71c-fe567b0cfe12/classroomdocument/a3e213a7-9c56-4bd3-b71c-fe567b0cfe12/1606230873.pdf',
      'source_bucket',
    );

    expect(mockCopyObject).toHaveBeenCalledWith({
      Bucket: 'destination_bucket',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe12/classroomdocument/a3e213a7-9c56-4bd3-b71c-fe567b0cfe12/1606230873.pdf',
      CopySource: `source_bucket/a3e213a7-9c56-4bd3-b71c-fe567b0cfe12/classroomdocument/a3e213a7-9c56-4bd3-b71c-fe567b0cfe12/1606230873.pdf`,
    });
  });
});
