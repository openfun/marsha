'use strict';

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log');

const fs = require('fs');
const child_process = require('child_process');
const readline = require('readline');

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockInvoke = jest.fn();
jest.mock('aws-sdk', () => ({
  Lambda: function () {
    this.invoke = mockInvoke;
  },
}));

jest.mock('fs');
jest.mock('child_process');
jest.mock('readline');

const transmux = require('./transmux');

describe('transmux', () => {
  beforeEach(() => {
    console.log.mockReset();
    jest.resetAllMocks();
  });

  it('transmuxes a chunk for a given resolution', async () => {
    const playlistUri =
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_2.m3u8';
    const resolution = 720;
    const transmuxedVideoChunkFilename =
      '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/fragment1.mp4';
    const destinationBucketName = 'test-marsha-destination';
    const videoId = 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22';
    const videoStamp = '1610546271';
    const resolutionsFilePath =
      '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/resolutions.txt';
    const resolutionListPath =
      '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/list.txt';

    const mockAccess = fs.access.mockImplementation((path, mode, callback) =>
      callback(`file ${path} does not exists`, null),
    );

    const mockedExecFile = child_process.execFile.mockImplementationOnce(
      (command, args, options, callback) =>
        callback(null, { stdout: 'ffmpeg MP4 ended' }),
    );

    const mockedRename = fs.rename.mockImplementation(
      (oldFile, newFile, callback) => callback(null, 'success'),
    );

    const returnValue = await transmux(
      {
        'detail-type': 'transmux',
        resolution,
        playlistUri,
        transmuxedVideoChunkFilename,
        from: 0,
        to: 42,
        destinationBucketName,
        videoId,
        videoStamp,
        resolutionsFilePath,
        resolutionListPath,
      },
      'test-lambda-mediapackage',
    );

    // transcoded video treatment
    expect(mockedExecFile).toHaveBeenCalledWith(
      'ffmpeg',
      [
        '-y',
        '-v',
        'error',
        '-ss',
        0,
        '-i',
        playlistUri,
        '-t',
        42,
        '-codec',
        'copy',
        '-copyts', // keep origin timestamp
        '-avoid_negative_ts',
        1, // avoid negative timestamp for further muxer usage
        '-f',
        'mp4',
        '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/63c14b61c8a02f347a047a0ea3d68d37eaf64a35',
      ],
      { maxBuffer: 104857600 },
      expect.anything(),
    );

    expect(mockAccess).toHaveBeenCalledWith(
      transmuxedVideoChunkFilename,
      fs.constants.F_OK,
      expect.anything(),
    );

    expect(mockedRename).toHaveBeenCalledWith(
      '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/63c14b61c8a02f347a047a0ea3d68d37eaf64a35',
      transmuxedVideoChunkFilename,
      expect.anything(),
    );
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(returnValue).toEqual('missing files to concat');
  });

  it('transmuxes a chunk for a given resolution and invoke lambda', async () => {
    const playlistUri =
      'https://distribution_id.cloudfront.net/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/cmaf/test_a3e213a7-9c56-4bd3-b71c-fe567b0cfe22_1610546271_hls_2.m3u8';
    const resolution = 720;
    const transmuxedVideoChunkFilename =
      '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/fragment1.mp4';
    const destinationBucketName = 'test-marsha-destination';
    const videoId = 'a3e213a7-9c56-4bd3-b71c-fe567b0cfe22';
    const videoStamp = '1610546271';
    const resolutionsFilePath =
      '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/resolutions.txt';
    const resolutionListPath =
      '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/list.txt';

    const mockAccessFirst = fs.access.mockImplementationOnce(
      (path, mode, callback) => callback(`file ${path} does not exists`, null),
    );

    const mockedExecFile = child_process.execFile.mockImplementationOnce(
      (command, args, options, callback) =>
        callback(null, { stdout: 'ffmpeg MP4 ended' }),
    );

    const mockedRename = fs.rename.mockImplementation(
      (oldFile, newFile, callback) => callback(null, 'success'),
    );

    const mockAccess = fs.access.mockImplementation((path, option, callback) =>
      callback(null, true),
    );

    mockInvoke.mockReturnValue({
      promise: () => Promise.resolve(),
    });

    const mockedCreateReadStream = fs.createReadStream.mockImplementation(
      (path) => 'foo',
    );
    const mockedReadlineCreateInterface = readline.createInterface.mockImplementation(
      (options) => {
        return {
          async *[Symbol.asyncIterator]() {
            yield "file '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/fragment0.mp4'";
            yield "file '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/fragment1.mp4'";
            yield "file '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/fragment2.mp4'";
          },
        };
      },
    );

    await transmux(
      {
        'detail-type': 'transmux',
        resolution,
        playlistUri,
        transmuxedVideoChunkFilename,
        from: 0,
        to: 42,
        destinationBucketName,
        videoId,
        videoStamp,
        resolutionsFilePath,
        resolutionListPath,
      },
      'test-lambda-mediapackage',
    );

    // transcoded video treatment
    expect(mockedExecFile).toHaveBeenCalledWith(
      'ffmpeg',
      [
        '-y',
        '-v',
        'error',
        '-ss',
        0,
        '-i',
        playlistUri,
        '-t',
        42,
        '-codec',
        'copy',
        '-copyts', // keep origin timestamp
        '-avoid_negative_ts',
        1, // avoid negative timestamp for further muxer usage
        '-f',
        'mp4',
        '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/63c14b61c8a02f347a047a0ea3d68d37eaf64a35',
      ],
      { maxBuffer: 104857600 },
      expect.anything(),
    );

    expect(mockedRename).toHaveBeenCalledWith(
      '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/63c14b61c8a02f347a047a0ea3d68d37eaf64a35',
      transmuxedVideoChunkFilename,
      expect.anything(),
    );

    expect(mockedCreateReadStream).toHaveBeenCalledWith(resolutionListPath);
    expect(mockedReadlineCreateInterface).toHaveBeenCalledWith({
      input: 'foo',
      crlfDelay: Infinity,
    });

    expect(mockAccessFirst).toHaveBeenNthCalledWith(
      1,
      '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/fragment1.mp4',
      fs.constants.F_OK,
      expect.anything(),
    );
    expect(mockAccess).toHaveBeenNthCalledWith(
      2,
      '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/fragment0.mp4',
      fs.constants.F_OK,
      expect.anything(),
    );
    expect(mockAccess).toHaveBeenNthCalledWith(
      3,
      '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/fragment1.mp4',
      fs.constants.F_OK,
      expect.anything(),
    );
    expect(mockAccess).toHaveBeenNthCalledWith(
      4,
      '/mnt/transcoded_video/a3e213a7-9c56-4bd3-b71c-fe567b0cfe22/720/fragment2.mp4',
      fs.constants.F_OK,
      expect.anything(),
    );

    expect(mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'test-lambda-mediapackage',
      InvocationType: 'Event',
      Payload: JSON.stringify({
        'detail-type': 'concat',
        resolution: 720,
        destinationBucketName,
        videoId,
        videoStamp,
        resolutionsFilePath,
        resolutionListPath,
      }),
    });
  });
});
