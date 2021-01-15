'use strict';

const AWS = require('aws-sdk');
const { Parser } = require('m3u8-parser');
const fetch = require('node-fetch');
const updateState = require('update-state');

const { CLOUDFRONT_ENDPOINT } = process.env;
const mediapackage = new AWS.MediaPackage({ apiVersion: '2017-10-12' });
const lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });

module.exports = async (event, lambdaFunctionName) => {
  const harvestJob = event.detail.harvest_job;
  if (harvestJob.status !== 'SUCCEEDED') {
    return Promise.reject(
      new Error(
        `harvest jos status is not SUCCEEDED. Current status: ${harvestJob.status}`,
      ),
    );
  }

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

  // The harvest id has this pattern : {environment}_{pk}_{stamp}
  // splitting it give us the information we need
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

  return Promise.all(
    parsedManifest.playlists.map(async (playlist) => {
      const resolution = playlist.attributes.RESOLUTION.height;
      const playlistUri = `https://${CLOUDFRONT_ENDPOINT}/${elements[1]}/cmaf/${playlist.uri}`;

      const workingDir = '/mnt/transmuxed_video';

      const transmuxedVideoFilename = `${workingDir}/${Date.now()}_${resolution}.mp4`;
      const thumbnailFilename = `${workingDir}/${Date.now()}_${resolution}.jpg`;

      await lambda
        .invoke({
          FunctionName: lambdaFunctionName,
          InvocationType: 'Event',
          Payload: JSON.stringify({
            'detail-type': 'transmux',
            resolution,
            playlistUri,
            transmuxedVideoFilename,
            thumbnailFilename,
            destinationBucketName: harvestJob.s3_destination.bucket_name,
            video_id: elements[1],
            video_stamp: elements[2],
          }),
        })
        .promise();

      return resolution;
    }),
  ).then((resolutions) =>
    updateState(`${elements[1]}/video/${elements[1]}/${elements[2]}`, 'ready', {
      resolutions,
    }),
  );
};
