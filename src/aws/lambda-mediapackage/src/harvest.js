'use strict';

const AWS = require('aws-sdk');
const { Parser } = require('m3u8-parser');
const fetch = require('node-fetch');

const recordSlicesState = require('./utils/recordSlicesState');
const mergeRecordSlicesManifest = require('./utils/mergeRecordSlicesManifest');
const setRecordingSliceManifestKey = require('./utils/setRecordingSliceManifestKey');

const {
  CLOUDFRONT_ENDPOINT,
  CONTAINER_NAME,
  ECS_CLUSTER,
  ECS_TASK_DEFINITION,
  VPC_SUBNET1,
  VPC_SUBNET2,
  SECURITY_GROUP,
  DESTINATION_BUCKET_REGION,
  DESTINATION_BUCKET_NAME,
} = process.env;

const mediapackage = new AWS.MediaPackage({ apiVersion: '2017-10-12' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const ecs = new AWS.ECS({ apiVersion: '2014-11-13' });

const HARVESTED = 'harvested';

module.exports = async (event, lambdaFunctionName) => {
  const harvestJob = event.detail.harvest_job;
  if (harvestJob.status !== 'SUCCEEDED') {
    return Promise.reject(
      new Error(
        `harvest jos status is not SUCCEEDED. Current status: ${harvestJob.status}`,
      ),
    );
  }

  let stamp = undefined;
  // The harvest id has this pattern : {environment}_{pk}_{stamp}_{jobCount}
  // splitting it give us the information we need
  const [environment, pk, idStamp, jobCount] = harvestJob.id.split('_');

  // first fetch origin endpoint to retrieve channel id
  const endpoint = await mediapackage
    .describeOriginEndpoint({
      Id: harvestJob.origin_endpoint_id,
    })
    .promise();

  if (jobCount) {
    stamp = idStamp;
  } else {
    stamp = endpoint.Tags.stamp;
  }

  await setRecordingSliceManifestKey(
    pk,
    harvestJob.id,
    harvestJob.s3_destination.manifest_key,
  );

  const state = await recordSlicesState(pk);
  if (state.status !== HARVESTED) {
    return Promise.resolve();
  }

  // delete mediapackage endpoint and channel
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

  // merge manifests from all slices
  const manifestUrl = await mergeRecordSlicesManifest(
    environment,
    pk,
    stamp,
    state.recording_slices,
  );

  // fetch the manifest content
  const response = await fetch(manifestUrl);
  const manifest = await response.text();

  console.log('Generated manifest url:', manifestUrl);
  console.log('Generated manifest content:', manifest);

  // parse the manifest
  const hlsParser = new Parser();
  hlsParser.push(manifest);
  hlsParser.end();

  const parsedManifest = hlsParser.manifest;
  const expectFilesKey = `${pk}/expected_files.json`;

  // using Promise.all allow us to invoke the lambda non asynchronously,
  // chunks will be generated randomly. It's the transmux function to check when all are done.
  const resolutionsMap = await Promise.all(
    parsedManifest.playlists.map(async (playlist) => {
      const resolution = playlist.attributes.RESOLUTION.height;
      const playlistUri = `https://${CLOUDFRONT_ENDPOINT}/${pk}/cmaf/${playlist.uri}`;
      const harvestedFilesDirectory = `https://${CLOUDFRONT_ENDPOINT}/${pk}/cmaf/`;
      const videoName = `${stamp}_${resolution}.mp4`;
      const videoKey = `${pk}/mp4/${videoName}`;
      const thumbnailName = `${stamp}_${resolution}.0000000.jpg`;
      const thumbnailKey = `${pk}/thumbnails/${thumbnailName}`;

      const task = await ecs
        .runTask({
          cluster: ECS_CLUSTER,
          taskDefinition: ECS_TASK_DEFINITION,
          launchType: 'FARGATE',
          networkConfiguration: {
            awsvpcConfiguration: {
              subnets: [VPC_SUBNET1, VPC_SUBNET2],
              assignPublicIp: 'ENABLED',
              securityGroups: [SECURITY_GROUP],
            },
          },
          overrides: {
            containerOverrides: [
              {
                name: CONTAINER_NAME,
                environment: [
                  {
                    name: 'HLS_MANIFEST_ENDPOINT',
                    value: playlistUri,
                  },
                  {
                    name: 'HARVESTED_FILES_DIRECTORY',
                    value: harvestedFilesDirectory,
                  },
                  {
                    name: 'OUPUT_MP4_FILENAME',
                    value: videoName,
                  },
                  {
                    name: 'OUTPUT_THUMBNAIL_FILENAME',
                    value: thumbnailName,
                  },
                  {
                    name: 'VIDEO_BUCKET_KEY',
                    value: videoKey,
                  },
                  {
                    name: 'THUMBNAIL_BUCKET_KEY',
                    value: thumbnailKey,
                  },
                  {
                    name: 'DESTINATION_BUCKET_REGION',
                    value: DESTINATION_BUCKET_REGION,
                  },
                  {
                    name: 'LAMBDA_FUNCTION_NAME',
                    value: lambdaFunctionName,
                  },
                  {
                    name: 'EXPECTED_FILES_NAME',
                    value: expectFilesKey,
                  },
                  {
                    name: 'VIDEO_ENDPOINT',
                    value: `${pk}/video/${pk}/${stamp}`,
                  },
                ],
              },
            ],
          },
        })
        .promise();

      console.log(JSON.stringify(task));

      return {
        [resolution]: [videoKey, thumbnailKey],
      };
    }),
  );

  const expectedFiles = resolutionsMap.reduce(
    ({ resolutions, files }, resolutionMap) => ({
      resolutions: [...resolutions, Object.keys(resolutionMap)[0]],
      files: [...files, Object.values(resolutionMap)[0]],
    }),
    { resolutions: [], files: [] },
  );

  expectedFiles.files = expectedFiles.files.flat();

  return s3
    .putObject({
      Bucket: DESTINATION_BUCKET_NAME,
      Key: expectFilesKey,
      Body: JSON.stringify(expectedFiles),
      ContentType: 'application/json',
    })
    .promise();
};
