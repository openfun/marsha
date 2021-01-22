'use strict';

// Don't pollute tests with logs intended for CloudWatch
// jest.spyOn(console, 'log');

const { expect } = require('@jest/globals');
const fs = require('fs');

const mockPutObject = jest.fn();
const mockCreateMultipartUpload = jest.fn();
const mockUploadPart = jest.fn();
const mockCompleteMultipartUpload = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function () {
    this.putObject = mockPutObject;
    this.createMultipartUpload = mockCreateMultipartUpload;
    this.uploadPart = mockUploadPart;
    this.completeMultipartUpload = mockCompleteMultipartUpload;
  },
}));

const mockUpdateState = jest.fn();
jest.doMock('update-state', () => mockUpdateState);

jest.mock('fs');

const upload = require('./upload');

describe('upload', () => {
  beforeEach(() => {
    // console.log.mockReset();
    jest.resetAllMocks();
  });

  it('uploads all video and thumbnail to destination bucket', async () => {
    const event = {
      'detail-type': 'upload',
      filesToProcess: {
        540: {
          video: {
            filename:
              '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.mp4',
            key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_540.mp4',
          },
          thumbnail: {
            filename:
              '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.0000000.jpg',
            key:
              'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/thumbnails/1610458282_540.0000000.jpg',
          },
        },
        720: {
          video: {
            filename:
              '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/720/1610458282_720.mp4',
            key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_720.mp4',
          },
          thumbnail: {
            filename:
              '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/720/1610458282_720.0000000.jpg',
            key:
              'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/thumbnails/1610458282_720.0000000.jpg',
          },
        },
      },
      destinationBucketName: 'test-marsha-destination',
      videoBaseDirectory:
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19',
      videoId: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19',
      videoStamp: '1610458282',
    };

    mockPutObject.mockReturnValue({
      promise: () => Promise.resolve(),
    });
    mockCreateMultipartUpload.mockReturnValue({
      promise: () =>
        Promise.resolve({
          UploadId: 'multipart-upload-id',
        }),
    });
    mockUploadPart.mockReturnValue({
      promise: () =>
        Promise.resolve({
          ETag: 'uploadpart-etag',
        }),
    });
    mockCompleteMultipartUpload.mockReturnValue({
      promise: () => Promise.resolve(),
    });

    const mockedReadFile = fs.readFile.mockImplementation((path, callback) =>
      callback(null, `${path} content`),
    );
    const mockedRmdir = fs.rmdir.mockImplementation((path, options, callback) =>
      callback(null),
    );
    const mockedCreateReadStream = fs.createReadStream.mockImplementation(
      (path, options) => {
        return {
          async *[Symbol.asyncIterator]() {
            yield `chunk1 in ${path}`;
            yield `chunk2 in ${path}`;
            yield `chunk3 in ${path}`;
          },
        };
      },
    );

    await upload(event);

    expect(mockCreateMultipartUpload).toHaveBeenCalledTimes(2);
    expect(mockCompleteMultipartUpload).toHaveBeenCalledTimes(2);
    expect(mockUploadPart).toHaveBeenCalledTimes(6);

    // 540p
    expect(mockedCreateReadStream).toHaveBeenCalledWith(
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.mp4',
      {
        highWaterMark: 10 * 1024 * 1024, // 10 MB
      },
    );
    expect(mockCreateMultipartUpload).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_540.mp4',
      ContentType: 'video/mp4',
    });
    expect(mockUploadPart).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_540.mp4',
      PartNumber: 1,
      Body:
        'chunk1 in /mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.mp4',
      ContentMD5: 'WRdiPpF+eXfpTBqaWDnqng==',
      UploadId: 'multipart-upload-id',
    });
    expect(mockUploadPart).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_540.mp4',
      PartNumber: 2,
      Body:
        'chunk2 in /mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.mp4',
      ContentMD5: 'DQQyKV7iO10Q6Xtu+MUyuQ==',
      UploadId: 'multipart-upload-id',
    });
    expect(mockUploadPart).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_540.mp4',
      PartNumber: 3,
      Body:
        'chunk3 in /mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.mp4',
      ContentMD5: 'CZBYTiZE1vuLvO1m0INfdg==',
      UploadId: 'multipart-upload-id',
    });
    expect(mockCompleteMultipartUpload).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_540.mp4',
      MultipartUpload: {
        Parts: [
          {
            ETag: 'uploadpart-etag',
            PartNumber: 1,
          },
          {
            ETag: 'uploadpart-etag',
            PartNumber: 2,
          },
          {
            ETag: 'uploadpart-etag',
            PartNumber: 3,
          },
        ],
      },
      UploadId: 'multipart-upload-id',
    });

    expect(mockedReadFile).toHaveBeenCalledWith(
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.0000000.jpg',
      expect.anything(),
    );
    expect(mockPutObject).toHaveBeenCalledWith({
      Body:
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.0000000.jpg content',
      Bucket: 'test-marsha-destination',
      Key:
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/thumbnails/1610458282_540.0000000.jpg',
      ContentType: 'image/jpeg',
    });

    // 720p
    expect(mockedCreateReadStream).toHaveBeenCalledWith(
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/720/1610458282_720.mp4',
      {
        highWaterMark: 10 * 1024 * 1024, // 10 MB
      },
    );
    expect(mockCreateMultipartUpload).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_720.mp4',
      ContentType: 'video/mp4',
    });
    expect(mockUploadPart).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_720.mp4',
      PartNumber: 1,
      Body:
        'chunk1 in /mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/720/1610458282_720.mp4',
      ContentMD5: 'UEY5FDAq7rziCmHwvoPZLg==',
      UploadId: 'multipart-upload-id',
    });
    expect(mockUploadPart).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_720.mp4',
      PartNumber: 2,
      Body:
        'chunk2 in /mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/720/1610458282_720.mp4',
      ContentMD5: 'J2qIFaC6Ol7uvNY9owh9TQ==',
      UploadId: 'multipart-upload-id',
    });
    expect(mockUploadPart).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_720.mp4',
      PartNumber: 3,
      Body:
        'chunk3 in /mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/720/1610458282_720.mp4',
      ContentMD5: '74wJri6bcabIT7LQitytnw==',
      UploadId: 'multipart-upload-id',
    });
    expect(mockCompleteMultipartUpload).toHaveBeenCalledWith({
      Bucket: 'test-marsha-destination',
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_720.mp4',
      MultipartUpload: {
        Parts: [
          {
            ETag: 'uploadpart-etag',
            PartNumber: 1,
          },
          {
            ETag: 'uploadpart-etag',
            PartNumber: 2,
          },
          {
            ETag: 'uploadpart-etag',
            PartNumber: 3,
          },
        ],
      },
      UploadId: 'multipart-upload-id',
    });

    expect(mockedReadFile).toHaveBeenCalledWith(
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/720/1610458282_720.0000000.jpg',
      expect.anything(),
    );
    expect(mockPutObject).toHaveBeenCalledWith({
      Body:
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/720/1610458282_720.0000000.jpg content',
      Bucket: 'test-marsha-destination',
      Key:
        'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/thumbnails/1610458282_720.0000000.jpg',
      ContentType: 'image/jpeg',
    });

    expect(mockedRmdir).toHaveBeenCalledWith(
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19',
      { recursive: true },
      expect.anything(),
    );

    expect(mockUpdateState).toHaveBeenCalledWith(
      `a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/1610458282`,
      'pending_live',
      {
        resolutions: [540, 720],
      },
    );
  });
});
