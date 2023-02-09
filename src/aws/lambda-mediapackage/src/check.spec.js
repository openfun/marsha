'use strict';

process.env.DESTINATION_BUCKET_NAME = 'test-marsha-destination';
const marshaUrl = 'https://marsha.tld';
process.env.DISABLE_SSL_VALIDATION = 'false';
process.env.MARSHA_URL = marshaUrl;
process.env.SHARED_SECRET = 'some secret';

// Mock the AWS SDK calls
const mockGetObject = jest.fn();
const mockHeadObject = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function () {
    this.getObject = mockGetObject;
    this.headObject = mockHeadObject;
  },
}));

const mockSendRequest = jest.fn();
const mockComputeSignature = jest.fn();
jest.doMock('update-state/utils', () => ({
  computeSignature: mockComputeSignature,
  sendRequest: mockSendRequest,
}));

const check = require('./check');

describe('check', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Don't pollute tests with logs intended for CloudWatch
    jest.spyOn(console, 'log').mockImplementation();
  });

  it('ends the function if not all videos are transmuxed', async () => {
    const event = {
      'detail-type': 'check',
      expectedFilesKey:
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/expected_file.json',
      videoEndpoint:
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/1610458282',
    };

    mockGetObject.mockReturnValue({
      promise: () =>
        Promise.resolve({
          Body: {
            toString: () =>
              JSON.stringify({
                resolutions: ['540', '720'],
                files: [
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_540.mp4',
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/thumbnails/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_540.0000000.jpg',
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_720.mp4',
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/thumbnails/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_720.0000000.jpg',
                ],
              }),
          },
        }),
    });

    mockHeadObject.mockReturnValue({
      promise: () => Promise.reject('does not exists'),
    });

    await check(event);

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/expected_file.json',
    });

    expect(mockHeadObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_540.mp4',
    });

    expect(mockSendRequest).not.toHaveBeenCalled();
  });

  it('calls update-state when all videos are transmuxed', async () => {
    const event = {
      'detail-type': 'check',
      expectedFilesKey:
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/expected_file.json',
      videoEndpoint:
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/1610458282',
    };
    const context = {
      awsRequestId: '7954d4d1-9dd3-47f4-9542-e7fd5f937fe6',
      logGroupName: '/aws/lambda/dev-test-marsha-medialive',
    };

    mockGetObject.mockReturnValue({
      promise: () =>
        Promise.resolve({
          Body: {
            toString: () =>
              JSON.stringify({
                resolutions: ['540', '720'],
                files: [
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_540.mp4',
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/thumbnails/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_540.0000000.jpg',
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_720.mp4',
                  'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/thumbnails/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_720.0000000.jpg',
                ],
              }),
          },
        }),
    });

    mockHeadObject.mockReturnValue({
      promise: () => Promise.resolve(),
    });

    mockComputeSignature.mockReturnValue('foo');

    await check(event, context);

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/expected_file.json',
    });

    expect(mockHeadObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_540.mp4',
    });
    expect(mockHeadObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/thumbnails/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_540.0000000.jpg',
    });
    expect(mockHeadObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_720.mp4',
    });
    expect(mockHeadObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/thumbnails/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_720.0000000.jpg',
    });

    const expectedBody = {
      logGroupName: '/aws/lambda/dev-test-marsha-medialive',
      requestId: '7954d4d1-9dd3-47f4-9542-e7fd5f937fe6',
      state: 'harvested',
      extraParameters: {
        resolutions: [540, 720],
        uploaded_on: '1610458282',
      },
    };

    expect(mockComputeSignature).toHaveBeenCalledWith(
      'some secret',
      JSON.stringify(expectedBody),
    );

    expect(mockSendRequest).toHaveBeenCalledWith(
      expectedBody,
      'foo',
      false,
      `${marshaUrl}/api/videos/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/update-live-state/`,
      'PATCH',
    );
  });
});
