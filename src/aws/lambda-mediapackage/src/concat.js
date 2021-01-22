'use strict';

const AWS = require('aws-sdk');
const crypto = require('crypto');
const fs = require('fs');
const util = require('util');
const dirname = require('path').dirname;
const execFile = util.promisify(require('child_process').execFile);
const rename = util.promisify(fs.rename);
const readdir = util.promisify(fs.readdir);
const access = util.promisify(fs.access);

const lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });

module.exports = async (event, lambdaFunctionName) => {
  const resolutionDirname = dirname(event.resolutionListPath);
  const videoFilename = `${resolutionDirname}/${event.videoStamp}_${event.resolution}.mp4`;
  const thumbnailFilename = `${resolutionDirname}/${event.videoStamp}_${event.resolution}.0000000.jpg`;

  // test if the video already exists, if yes do not regenerate it
  try {
    await access(videoFilename, fs.constants.F_OK);

    console.log(`video ${videoFilename} already exists`);
    return Promise.resolve(`video ${videoFilename} already exists`);
  } catch (error) {
    console.log(`video ${videoFilename} doest not exists`, error);
  }

  console.log(`video to concat ${videoFilename}`);
  // create a temporary file
  const hash = crypto.createHash('sha1');
  hash.update(videoFilename);
  const tmpVideoFilename = `${resolutionDirname}/${hash.digest('hex')}`;

  // concat all chunks to create video file
  const concatLogs = await execFile(
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
      event.resolutionListPath, // the list file containing all chunks path
      '-codec', // encoder codec
      'copy', // copy the audio and video codec as it. This a transmux, not a transcode.
      '-f', // output format, must be set becaus FFMPEG can't guess it fronm the file name
      'mp4', // mp4 output format
      tmpVideoFilename,
    ],
    {
      maxBuffer: 100 * 1024 * 1024, // configure a big output to not block the lambda. Non will be used if there is no error
    },
  );
  console.log(
    `video ${videoFilename} concatenated`,
    JSON.stringify(concatLogs),
  );

  // generate thumbnail
  console.log('generating thumbnail');
  await execFile('ffmpeg', [
    '-y', // replace the output file if already exists. Prevent to block the lambda
    '-v', // change verbosity
    'error', // less verbose, we want only errors
    '-ss', // seek segment
    '00:00:01.000', // seek from the first second
    '-i', // input file
    tmpVideoFilename,
    '-vframes', // set the number of video frames to output
    '1', // 1 frame to output
    thumbnailFilename,
  ]);
  console.log(`thumbnail ${thumbnailFilename} generated`);

  await rename(tmpVideoFilename, videoFilename);
  const videoBaseDirectory = dirname(event.resolutionsFilePath);

  let filesToProcess;
  try {
    filesToProcess = await checkConcatFiles(
      videoBaseDirectory,
      event.videoStamp,
      event.videoId,
    );
  } catch (error) {
    console.log(error);
    // all videos are not concatenated
    console.log(error);
    return Promise.resolve('All videos are not concatenated');
  }

  console.log(filesToProcess);

  return lambda
    .invoke({
      FunctionName: lambdaFunctionName,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        'detail-type': 'upload',
        filesToProcess,
        destinationBucketName: event.destinationBucketName,
        videoBaseDirectory,
        videoId: event.videoId,
        videoStamp: event.videoStamp,
      }),
    })
    .promise();
};

// check if all concat have been made
const checkConcatFiles = async (videoBaseDirectory, videoStamp, videoId) => {
  const contentDir = await readdir(videoBaseDirectory, { withFileTypes: true });
  const filesToProcess = {};

  for (const item of contentDir) {
    if (item.isDirectory()) {
      const videoFilename = `${videoBaseDirectory}/${item.name}/${videoStamp}_${item.name}.mp4`;
      console.log(`checking existing file ${videoFilename}`);
      await access(videoFilename, fs.constants.F_OK);
      console.log(`existing file ${videoFilename}`);
      filesToProcess[item.name] = {
        video: {
          filename: videoFilename,
          key: `${videoId}/mp4/${videoStamp}_${item.name}.mp4`,
        },
        thumbnail: {
          filename: `${videoBaseDirectory}/${item.name}/${videoStamp}_${item.name}.0000000.jpg`,
          key: `${videoId}/thumbnails/${videoStamp}_${item.name}.0000000.jpg`,
        },
      };
    }
  }

  return filesToProcess;
};
