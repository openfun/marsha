'use strict';

const AWS = require('aws-sdk');
const crypto = require('crypto');
const util = require('util');
const fs = require('fs');
const readline = require('readline');
const execFile = util.promisify(require('child_process').execFile);
const rename = util.promisify(fs.rename);
const access = util.promisify(fs.access);
const dirname = require('path').dirname;

const lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });

module.exports = async (event, lambdaFunctionName) => {
  // test if the chunk already exists, if yes do not regenerate it
  try {
    await access(event.transmuxedVideoChunkFilename, fs.constants.F_OK);

    console.log(`chunk ${event.transmuxedVideoChunkFilename} already exists`);
    return Promise.resolve(
      `chunk ${event.transmuxedVideoChunkFilename} already exists`,
    );
  } catch (error) {
    console.log(
      `chunk ${event.transmuxedVideoChunkFilename} doest not exists`,
      error,
    );
  }

  const resolutiondirname = dirname(event.resolutionListPath);
  // create a temporary file. We use a temporary file because ffmpeg will create the file when it starts,
  // the checkChunksByResolution function will detect this file and think FFMPEG has ended this chunk
  const hash = crypto.createHash('sha1');
  hash.update(event.transmuxedVideoChunkFilename);
  const tmpFile = `${resolutiondirname}/${hash.digest('hex')}`;
  //generate chunk
  const transmuxedLogs = await execFile(
    'ffmpeg',
    [
      '-y', // replace the output file if already exists. Prevent to block the lambda
      '-v', // change verbosity
      'error', // less verbose, we want only errors
      '-ss', // seek segment
      event.from, // seeking video from
      '-i', // input
      event.playlistUri, // the hls endpoint for the current resolution
      '-t', // to
      event.to, // sseking video to
      '-codec', // encoder codec
      'copy', // copy the audio and video codec as it. This a transmux, not a transcode.
      '-copyts', // keep origin timestamp
      '-avoid_negative_ts',
      1, // avoid negative timestamp for further muxer usage
      '-f', // output format, must be set becaus FFMPEG can't guess it fronm the file name
      'mp4', // mp4 output format
      tmpFile, //output file
    ],
    {
      maxBuffer: 100 * 1024 * 1024, // configure a big output to not block the lambda.
    },
  );
  console.log(
    `transmuxing terminated for resolution ${event.resolution}`,
    JSON.stringify(transmuxedLogs),
  );
  // once chunk generated rename it with the wanted name
  await rename(tmpFile, event.transmuxedVideoChunkFilename);

  try {
    // check if all chunks are generated
    await checkChunksByResolution(event.resolutionListPath);
  } catch (error) {
    console.log(error);
    // all files are not generated, stop the lambda but without error
    return Promise.resolve('missing files to concat');
  }
  console.log('all chunks are generated, calling concat lambda');

  // all chunks are generated, concat them
  return lambda
    .invoke({
      FunctionName: lambdaFunctionName,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        'detail-type': 'concat',
        resolution: event.resolution,
        destinationBucketName: event.destinationBucketName,
        videoId: event.videoId,
        videoStamp: event.videoStamp,
        resolutionsFilePath: event.resolutionsFilePath,
        resolutionListPath: event.resolutionListPath,
      }),
    })
    .promise();
};

const checkChunksByResolution = async (resolutionListPath) => {
  const resolutionFileStream = fs.createReadStream(resolutionListPath);
  const resolutionReadline = readline.createInterface({
    input: resolutionFileStream,
    crlfDelay: Infinity,
  });

  const filenameRegex = /^file '(.*)'$/;
  // read line by line the list file to check if all the chunks are generated
  for await (const line of resolutionReadline) {
    console.log(line);
    const result = filenameRegex.exec(line);
    // don't catch error, let it bubble
    await access(`${result[1]}`, fs.constants.F_OK);
  }
};
