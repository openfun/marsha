'use strict';

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log');

const fs = require('fs');
const child_process = require('child_process');

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockPutObject = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function () {
    this.putObject = mockPutObject;
  },
}));

jest.mock('fs');
jest.mock('child_process');

const transmux = require('./transmux')

describe('transmux', () => {
  it('transmuxes a video for a given resolution', async () => {
    const playlistUri = 'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/dev-manu_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_2.m3u8';
    const resolution = 720;
    const transmuxedVideoFilename = '/mnt/transcoded_video/1111_720.mp4';
    const thumbnailFilename =  '/mnt/transcoded_video/1111_720.jpg';
    const destinationBucketName = 'test-marsha-destination';
    const video_id = 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22';
    const video_stamp = '1610546271';

    const mockedExecFileTranscodedFile = child_process.execFile.mockImplementationOnce(
      (command, args, options, callback) =>
        callback(null, { stdout: 'ffmpeg MP4 ended' }),
    );
    const mockedReadFileTranscodedFile = fs.readFile.mockImplementationOnce((path, callback) =>
      callback(null, 'MP4 file content'),
    );

    const mockedExecFileThumbnailFile = child_process.execFile.mockImplementationOnce(
      (command, args, callback) =>
        callback(null, { stdout: 'thumbnail ffmpeg ended' }),
    );
    const mockedReadFileThumbnailFile = fs.readFile.mockImplementationOnce((path, callback) =>
      callback(null, 'Thumbnail file content'),
    );

    const mockedUnlink = fs.unlink.mockImplementation((path, callback) =>
      callback(null),
    );

    mockPutObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

    await transmux({
      resolution,
      playlistUri,
      transmuxedVideoFilename,
      thumbnailFilename,
      destinationBucketName,
      video_id,
      video_stamp
    });

    // transcoded video treatment
    expect(mockedExecFileTranscodedFile).toHaveBeenCalledWith(
      'ffmpeg',
      [
        '-i',
        playlistUri,
        '-codec',
        'copy',
        '-f',
        'mp4',
        transmuxedVideoFilename,
      ],
      { maxBuffer: 104857600 },
      expect.anything(),
    );
    expect(mockedReadFileTranscodedFile).toHaveBeenCalledWith(
      transmuxedVideoFilename,
      expect.anything(),
    );
    expect(mockedUnlink).toHaveBeenNthCalledWith(
      1,
      transmuxedVideoFilename,
      expect.anything(),
    );
    expect(mockPutObject).toHaveBeenNthCalledWith(1, {
      Body: 'MP4 file content',
      Bucket: destinationBucketName,
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/mp4/1610546271_720.mp4',
      ContentType: 'video/mp4',
    });

      // thumbnail treatment
    expect(mockedExecFileThumbnailFile).toHaveBeenCalledWith(
      'ffmpeg',
      [
        '-i',
        transmuxedVideoFilename,
        '-ss',
        '00:00:01.000',
        '-vframes',
        '1',
        thumbnailFilename,
      ],
      expect.anything(),
    );
    expect(mockedReadFileThumbnailFile).toHaveBeenCalledWith(
      thumbnailFilename,
      expect.anything(),
    );
    expect(mockedUnlink).toHaveBeenNthCalledWith(
      2,
      thumbnailFilename,
      expect.anything(),
    );
    expect(mockPutObject).toHaveBeenNthCalledWith(2, {
      Body: 'Thumbnail file content',
      Bucket: destinationBucketName,
      Key: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/thumbnails/1610546271_720.0000000.jpg',
      ContentType: 'image/jpeg',
    });
  });
});
