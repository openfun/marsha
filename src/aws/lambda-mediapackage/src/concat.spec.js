'use strict';

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log');

const fs = require('fs');
const child_process = require('child_process');

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockInvoke = jest.fn();
jest.mock('aws-sdk', () => ({
  Lambda: function () {
    this.invoke = mockInvoke;
  },
}));

jest.mock('fs');
jest.mock('child_process');

const concat = require('./concat');

describe('concat', () => {
  beforeEach(() => {
    console.log.mockReset();
    jest.resetAllMocks();
  });

  it('receives an event, concat a video and stop the lambda', async () => {
    const event = {
      'detail-type': 'concat',
      resolution: 540,
      destinationBucketName: 'test-marsha-destination',
      videoId: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19',
      videoStamp: '1610458282',
      resolutionsFilePath:
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/resolutions.txt',
      resolutionListPath:
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/list.txt',
    };

    const mockedAccess = fs.access.mockImplementationOnce(
      (path, mode, callback) => callback(`file ${path} does not exists`, null),
    );
    fs.access.mockImplementationOnce((path, mode, callback) =>
      callback(null, true),
    );
    fs.access.mockImplementationOnce((path, mode, callback) =>
      callback(`file ${path} does not exists`, null, null),
    );

    const mockedRename = fs.rename.mockImplementation(
      (oldPath, newPath, callback) => callback(null),
    );
    const mockedReaddir = fs.readdir.mockImplementation(
      (path, options, callback) =>
        callback(null, [
          {
            isDirectory: () => true,
            name: 540,
          },
          {
            isDirectory: () => true,
            name: 720,
          },
        ]),
    );

    const mockedExecFile = child_process.execFile.mockImplementationOnce(
      (command, args, options, callback) =>
        callback(null, { stdout: 'ffmpeg concat ended' }),
    );

    child_process.execFile.mockImplementationOnce((command, args, callback) =>
      callback(null, { stdout: 'ffmpeg thumbnail ended' }),
    );

    await concat(event, 'test-lambda-mediapackage');

    expect(mockedExecFile).toHaveBeenCalledWith(
      'ffmpeg',
      [
        '-y', // replace the output file if already exists. Prevent to block the lambda
        '-v', // change verbosity
        'error', // less verbose, we want only errors
        '-f', // specify the input format
        'concat', // concat protol used as input
        '-safe', // file used in input contains absolute path, this option must be used
        '0', // path used in the file are absolute
        '-i', // input file
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/list.txt', // the list file containing all chunks path
        '-codec', // encoder codec
        'copy', // copy the audio and video codec as it. This a transmux, not a transcode.
        '-f', // output format, must be set becaus FFMPEG can't guess it fronm the file name
        'mp4', // mp4 output format
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/805288f5b7a07574c6795817710bf564063df64c',
      ],
      {
        maxBuffer: 100 * 1024 * 1024, // configure a big output to not block the lambda. Non will be used if there is no error
      },
      expect.anything(),
    );

    expect(mockedExecFile).toHaveBeenCalledWith(
      'ffmpeg',
      [
        '-y', // replace the output file if already exists. Prevent to block the lambda
        '-v', // change verbosity
        'error', // less verbose, we want only errors
        '-ss', // seek segment
        '00:00:01.000', // seek from the first second
        '-i', // input file
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/805288f5b7a07574c6795817710bf564063df64c',
        '-vframes', // set the number of video frames to output
        '1', // 1 frame to output
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.0000000.jpg',
      ],
      expect.anything(),
    );

    expect(mockedRename).toHaveBeenCalledWith(
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/805288f5b7a07574c6795817710bf564063df64c',
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.mp4',
      expect.anything(),
    );

    expect(mockedAccess).toHaveBeenNthCalledWith(
      1,
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.mp4',
      fs.constants.F_OK,
      expect.anything(),
    );
    expect(mockedAccess).toHaveBeenNthCalledWith(
      2,
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.mp4',
      fs.constants.F_OK,
      expect.anything(),
    );
    expect(mockedAccess).toHaveBeenNthCalledWith(
      3,
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/720/1610458282_720.mp4',
      fs.constants.F_OK,
      expect.anything(),
    );

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('receives an event, concat a video and invoke the upload lambda', async () => {
    const event = {
      'detail-type': 'concat',
      resolution: 540,
      destinationBucketName: 'test-marsha-destination',
      videoId: 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19',
      videoStamp: '1610458282',
      resolutionsFilePath:
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/resolutions.txt',
      resolutionListPath:
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/list.txt',
    };

    const mockedAccess = fs.access.mockImplementationOnce(
      (path, mode, callback) => callback(`file ${path} does not exists`, null),
    );
    fs.access.mockImplementation((path, mode, callback) =>
      callback(null, true),
    );

    const mockedRename = fs.rename.mockImplementation(
      (oldPath, newPath, callback) => callback(null),
    );
    const mockedReaddir = fs.readdir.mockImplementation(
      (path, options, callback) =>
        callback(null, [
          {
            isDirectory: () => true,
            name: 540,
          },
          {
            isDirectory: () => true,
            name: 720,
          },
        ]),
    );

    const mockedExecFile = child_process.execFile.mockImplementationOnce(
      (command, args, options, callback) =>
        callback(null, { stdout: 'ffmpeg concat ended' }),
    );

    child_process.execFile.mockImplementationOnce((command, args, callback) =>
      callback(null, { stdout: 'ffmpeg thumbnail ended' }),
    );

    mockInvoke.mockReturnValue({
      promise: () => Promise.resolve(),
    });

    await concat(event, 'test-lambda-mediapackage');

    expect(mockedExecFile).toHaveBeenCalledWith(
      'ffmpeg',
      [
        '-y', // replace the output file if already exists. Prevent to block the lambda
        '-v', // change verbosity
        'error', // less verbose, we want only errors
        '-f', // specify the input format
        'concat', // concat protol used as input
        '-safe', // file used in input contains absolute path, this option must be used
        '0', // path used in the file are absolute
        '-i', // input file
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/list.txt', // the list file containing all chunks path
        '-codec', // encoder codec
        'copy', // copy the audio and video codec as it. This a transmux, not a transcode.
        '-f', // output format, must be set becaus FFMPEG can't guess it fronm the file name
        'mp4', // mp4 output format
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/805288f5b7a07574c6795817710bf564063df64c',
      ],
      {
        maxBuffer: 100 * 1024 * 1024, // configure a big output to not block the lambda. Non will be used if there is no error
      },
      expect.anything(),
    );

    expect(mockedExecFile).toHaveBeenCalledWith(
      'ffmpeg',
      [
        '-y', // replace the output file if already exists. Prevent to block the lambda
        '-v', // change verbosity
        'error', // less verbose, we want only errors
        '-ss', // seek segment
        '00:00:01.000', // seek from the first second
        '-i', // input file
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/805288f5b7a07574c6795817710bf564063df64c',
        '-vframes', // set the number of video frames to output
        '1', // 1 frame to output
        '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.0000000.jpg',
      ],
      expect.anything(),
    );

    expect(mockedRename).toHaveBeenCalledWith(
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/805288f5b7a07574c6795817710bf564063df64c',
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.mp4',
      expect.anything(),
    );

    expect(mockedAccess).toHaveBeenNthCalledWith(
      1,
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.mp4',
      fs.constants.F_OK,
      expect.anything(),
    );
    expect(mockedAccess).toHaveBeenNthCalledWith(
      2,
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.mp4',
      fs.constants.F_OK,
      expect.anything(),
    );
    expect(mockedAccess).toHaveBeenNthCalledWith(
      3,
      '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/720/1610458282_720.mp4',
      fs.constants.F_OK,
      expect.anything(),
    );

    expect(mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'test-lambda-mediapackage',
      InvocationType: 'Event',
      Payload: JSON.stringify({
        'detail-type': 'upload',
        filesToProcess: {
          540: {
            video: {
              filename:
                '/mnt/transmuxed_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/540/1610458282_540.mp4',
              key:
                'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_540.mp4',
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
              key:
                'a3e213a7-9c56-4bd3-b71c-fe567b0cfe19/mp4/1610458282_720.mp4',
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
      }),
    });
  });
});
