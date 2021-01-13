'use strict';

const AWS = require('aws-sdk');
const { Parser } = require('m3u8-parser');
const fetch = require('node-fetch');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const readFile = util.promisify(require('fs').readFile);
const unlink = util.promisify(require('fs').unlink);
const updateState = require('update-state');

const { CLOUDFRONT_ENDPOINT } = process.env;
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const mediapackage = new AWS.MediaPackage({ apiVersion: '2017-10-12' });

module.exports = async (event) => {
  const harvestJob = event.detail.harvest_job;
  if (harvestJob.status !== 'SUCCEEDED') {
    return Promise.reject(
      new Error(
        `harvest jos status is not SUCCEEDED. Current status: ${harvestJob.status}`,
      ),
    );
  }

  // The harvest id has this pattern : {environment}_{pk}_{stamp}
  // From the id we can know to which environment route the event to the good lambda
  const elements = event.detail.harvest_job.id.split('_');
  // build the hls manifest url
  const manifestUrl = `https://${CLOUDFRONT_ENDPOINT}/${harvestJob.s3_destination.manifest_key}`;

  // fetch the manifest content
  const response = await fetch(manifestUrl);
  const manifest = await response.text();

  // parse the manifest
  const hlsParser = new Parser();
  hlsParser.push(manifest);
  hlsParser.end();

  const parsedManifest = hlsParser.manifest;

  const playlist = parsedManifest.playlists.find(
    (playlist) => playlist.attributes.RESOLUTION.height == 720,
  );
  const playlistUri = `https://${CLOUDFRONT_ENDPOINT}/${elements[1]}/cmaf/${playlist.uri}`;

  const transcodedVideoDir = '/mnt/transcoded_video';

  const tempFilename = `${transcodedVideoDir}/${Date.now()}_720.mp4`;
  console.log(`starting hls transcoding to mp4 ${playlistUri}`);
  const log = await execFile(
    'ffmpeg',
    ['-i', playlistUri, '-codec', 'copy', '-f', 'mp4', tempFilename],
    {
      maxBuffer: 100 * 1024 * 1024,
    },
  );
  console.log(log);
  console.log('transcoding terminated', JSON.stringify(log));

  console.log('starting upload to s3 bucket');
  await s3
    .putObject({
      Body: await readFile(tempFilename),
      Bucket: harvestJob.s3_destination.bucket_name,
      Key: `${elements[1]}/mp4/${elements[2]}_720.mp4`,
      ContentType: 'video/mp4',
    })
    .promise();
  console.log('upload terminated');

  // delete transcoded video
  await unlink(tempFilename);

  // delete mediapackage endpoint and channel
  // first fetch origin endpoint to retrieve channel id
  const endpoint = await mediapackage
    .describeOriginEndpoint({
      Id: harvestJob.origin_endpoint_id,
    })
    .promise();

  // delete origin endpoint
  await mediapackage
    .deleteOriginEndpoint({
      Id: endpoint.Id,
    })
    .promise();

  // delete channel
  await mediapackage
    .deleteChannel({
      Id: endpoint.ChannelId,
    })
    .promise();

  // object key: {video_id}/video/{video_id}/{stamp}
  return updateState(
    `${elements[1]}/video/${elements[1]}/${elements[2]}`,
    'ready',
    { resolutions: [720] },
  );
};
