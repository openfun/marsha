'use strict';

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log');

process.env.DESTINATION_BUCKET_NAME = 'test-marsha-destination';

// Mock the AWS SDK calls
const mockGetObject = jest.fn();
const mockHeadObject = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function () {
    this.getObject = mockGetObject;
    this.headObject = mockHeadObject;
  },
}));

const mockUpdateState = jest.fn();
jest.doMock('update-state', () => mockUpdateState);

const check = require('./check');

describe('check', () => {
  beforeEach(() => {
    console.log.mockReset();
    jest.resetAllMocks();
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
      promise: () => Promise.reject('doest not exists'),
    });

    await check(event);

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/expected_file.json',
    });

    expect(mockHeadObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key:
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_540.mp4',
    });

    expect(mockUpdateState).not.toHaveBeenCalled();
  });

  it('calls update-state when all videos are transmuxed', async () => {
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
      promise: () => Promise.resolve(),
    });

    await check(event);

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/expected_file.json',
    });

    expect(mockHeadObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key:
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_540.mp4',
    });
    expect(mockHeadObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key:
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/thumbnails/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_540.0000000.jpg',
    });
    expect(mockHeadObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key:
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_720.mp4',
    });
    expect(mockHeadObject).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key:
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/thumbnails/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19_720.0000000.jpg',
    });

    expect(mockUpdateState).toHaveBeenCalledWith(
      'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/1610458282',
      'pending_live',
      {
        resolutions: [540, 720],
      },
    );
  });
});
