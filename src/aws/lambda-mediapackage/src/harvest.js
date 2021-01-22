'use strict';

const AWS = require('aws-sdk');
const { Parser } = require('m3u8-parser');
const fetch = require('node-fetch');
const util = require('util');
const fs = require('fs');
const open = util.promisify(fs.open);
const write = util.promisify(fs.write);
const close = util.promisify(fs.close);
const mkdir = util.promisify(fs.mkdir);
const rmdir = util.promisify(fs.rmdir);
const os = require('os');

const { CLOUDFRONT_ENDPOINT, CHUNK_DURATION: raw_chunk } = process.env;
const CHUNK_DURATION = parseInt(raw_chunk);

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
  const elements = harvestJob.id.split('_');
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

  const startTime = new Date(harvestJob.start_time);
  const endTime = new Date(harvestJob.end_time);
  const duration = parseInt((endTime.getTime() - startTime.getTime()) / 1000);

  // split duration in chunck of x seconds
  const numberOfChunks = Math.floor(duration / CHUNK_DURATION); // find number of plain chunk
  const lastChunkDuration = duration - numberOfChunks * CHUNK_DURATION; // compute last chunk duration

  // create an array of this form [[start, end], [start, end]]
  const chunks = Array(numberOfChunks)
    .fill(null)
    .reduce((acc, curr, index) => {
      const lastChunk = acc[index - 1] || [0, 0];
      acc.push([lastChunk[1], lastChunk[1] + CHUNK_DURATION]);
      return acc;
    }, []);
  chunks.push([
    (chunks[chunks.length - 1] || [0, 0])[1],
    (chunks[chunks.length - 1] || [0, 0])[1] + lastChunkDuration,
  ]);
  // /mnt/transmuxed_video/{pk}
  const workingDir = `/mnt/transmuxed_video/${elements[1]}`;
  // delete working dir if already exists. Thi can happen when a previous lambda failed and didn't complete.
  await rmdir(workingDir, { recursive: true });

  // create the working directory
  await mkdir(workingDir, { recursive: true });

  // resolution file contains all the directories for all resolutions available
  // ex :
  //    /mnt/transmuxed_video/{pk}/320
  //    /mnt/transmuxed_video/{pk}/480
  //    /mnt/transmuxed_video/{pk}/720
  const resolutionsFilePath = `${workingDir}/resolutions.txt`;

  const resolutionFileDescriptor = await open(resolutionsFilePath, 'w');

  // using Promise.all allow us to invoke the lambda non asynchronously,
  // chunks will be generated randomly. It's the transmux function to check when all are done.
  await Promise.all(
    parsedManifest.playlists.map(async (playlist) => {
      const resolution = playlist.attributes.RESOLUTION.height;
      const playlistUri = `https://${CLOUDFRONT_ENDPOINT}/${elements[1]}/cmaf/${playlist.uri}`;
      const currentResolutionDir = `${workingDir}/${resolution}`;

      // the list file contains all the chunks generated in a form FFMPEG can read
      const currentResolutionFilePath = `${currentResolutionDir}/list.txt`;

      // create the resolution directory
      await mkdir(currentResolutionDir, { recursive: true });

      // write in the resolution file the current resolution directory path
      await write(
        resolutionFileDescriptor,
        `${currentResolutionFilePath}${os.EOL}`,
      );

      // open the list file for the current directory in write mode.
      const currentResolutionFileDescriptor = await open(
        currentResolutionFilePath,
        'w',
      );

      let i = 0;
      for (const chunk of chunks) {
        const transmuxedVideoChunkFilename = `${currentResolutionDir}/fragment${i}.mp4`;

        // write in the list file the current fragment path
        await write(
          currentResolutionFileDescriptor,
          `file '${transmuxedVideoChunkFilename}'${os.EOL}`,
        );

        // invoke the lambda for the current chunk
        await lambda
          .invoke({
            FunctionName: lambdaFunctionName,
            InvocationType: 'Event',
            Payload: JSON.stringify({
              'detail-type': 'transmux',
              resolution,
              playlistUri,
              transmuxedVideoChunkFilename,
              from: chunk[0],
              to: chunk[1],
              destinationBucketName: harvestJob.s3_destination.bucket_name,
              videoId: elements[1],
              videoStamp: elements[2],
              resolutionsFilePath,
              resolutionListPath: currentResolutionFilePath,
            }),
          })
          .promise();

        i++;
      }

      // close the list file and return a promise
      return close(currentResolutionFileDescriptor);
    }),
  );

  // close the resolution file and return a promise
  return close(resolutionFileDescriptor);
};
