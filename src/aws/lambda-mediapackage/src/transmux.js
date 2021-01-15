'use strict';

const AWS = require('aws-sdk');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const readFile = util.promisify(require('fs').readFile);
const unlink = util.promisify(require('fs').unlink);

const s3 = new AWS.S3({apiVersion: '2006-03-01'});

module.exports = async (event) => {
  const transmuxedLogs = await execFile(
    'ffmpeg',
    ['-i', event.playlistUri, '-codec', 'copy', '-f', 'mp4', event.transmuxedVideoFilename],
    {
      maxBuffer: 100 * 1024 * 1024,
    },
  );
  console.log(
    `transmuxing terminated for resolution ${event.resolution}`,
    JSON.stringify(transmuxedLogs),
  );

  // generate a thumbnail from the MP4 from the first second of the video
  console.log(`generating thumbnail for resolution ${event.resolution}`);
  const thumbnailLogs = await execFile('ffmpeg', [
    '-i',
    event.transmuxedVideoFilename,
    '-ss',
    '00:00:01.000',
    '-vframes',
    '1',
    event.thumbnailFilename,
  ]);
  console.log(
    `thumbnail generated for resolution ${event.resolution}`,
    JSON.stringify(thumbnailLogs),
  );

  console.log(
    'starting uploading MP4 for resolution ${resolution} to s3 bucket',
  );
  await s3
    .putObject({
      Body: await readFile(event.transmuxedVideoFilename),
      Bucket: event.destinationBucketName,
      Key: `${event.video_id}/mp4/${event.video_stamp}_${event.resolution}.mp4`,
      ContentType: 'video/mp4',
    })
    .promise();
  console.log(`MP4 upload for resolution ${event.resolution} terminated`);

  // delete transmuxed video
  await unlink(event.transmuxedVideoFilename);

  // upload thumbnail
  console.log(
    `starting uploading thumbnail for resolution ${event.resolution} to s3 bucket`,
  );
  await s3
    .putObject({
      Body: await readFile(event.thumbnailFilename),
      Bucket:event. destinationBucketName,
      Key: `${event.video_id}/thumbnails/${event.video_stamp}_${event.resolution}.0000000.jpg`,
      ContentType: 'image/jpeg',
    })
    .promise();
  console.log(`thumbnail upload for resolution ${event.resolution} terminated`);

  // delete thumbnail
  return unlink(event.thumbnailFilename);
};
