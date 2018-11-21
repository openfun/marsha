'use strict';

const AWS = require('aws-sdk');

const updateState = require('./src/updateState');

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const envType = process.env.ENV_TYPE;
  const objectKey = event.Records[0].s3.object.key;
  const sourceBucket = event.Records[0].s3.bucket.name;
  const destinationBucket = process.env.S3_DESTINATION_BUCKET;

  if (objectKey.split('/').length != 4) {
    let error =
      'Source videos should be uploaded in a folder of the form ' +
      '"{playlist_id}/{video_id}/videos/{stamp}".' +
      'Source timed text files should be uploaded to a folder of the form ' +
      '"{playlist_id}/{video_id}/timedtext/{stamp}_{language}[_{mode}]".';
    callback(error);
    return;
  }

  let params = {
    Role: process.env.MEDIA_CONVERT_ROLE,
    UserMetadata: {
      Bucket: sourceBucket,
      ObjectKey: objectKey,
    },
    Settings: {
      AdAvailOffset: 0,
      Inputs: [
        {
          FilterEnable: 'AUTO',
          PsiControl: 'USE_PSI',
          FilterStrength: 0,
          DeblockFilter: 'DISABLED',
          DenoiseFilter: 'DISABLED',
          TimecodeSource: 'EMBEDDED',
          VideoSelector: {
            ColorSpace: 'FOLLOW',
          },
          AudioSelectors: {
            'Audio Selector 1': {
              Offset: 0,
              DefaultSelection: 'DEFAULT',
              ProgramSelection: 1,
            },
          },
          FileInput: `s3://${sourceBucket}/${objectKey}`,
        },
      ],
      OutputGroups: [
        {
          CustomName: 'Video MP4 outputs',
          Name: 'File Group',
          OutputGroupSettings: {
            Type: 'FILE_GROUP_SETTINGS',
            FileGroupSettings: {
              Destination: `s3://${destinationBucket}/${objectKey.replace(
                /\/video\/.*\//,
                '/mp4/',
              )}`,
            },
          },
          Outputs: ['144', '240', '480', '720', '1080'].map(size => ({
            Preset: `${envType}_marsha_video_mp4_${size}`,
            NameModifier: `_${size}`,
          })),
        },
        {
          CustomName: 'Video CMAF outputs',
          Name: 'CMAF',
          OutputGroupSettings: {
            Type: 'CMAF_GROUP_SETTINGS',
            CmafGroupSettings: {
              WriteDashManifest: 'ENABLED',
              WriteHlsManifest: 'ENABLED',
              FragmentLength: 2,
              SegmentLength: 14,
              SegmentControl: 'SEGMENTED_FILES',
              Destination: `s3://${destinationBucket}/${objectKey.replace(
                /\/video\/.*\//,
                '/cmaf/',
              )}`,
            },
          },
          Outputs: [
            ...['144', '240', '480', '720', '1080'].map(size => ({
              Preset: `${envType}_marsha_cmaf_video_${size}`,
              NameModifier: `_${size}`,
            })),
            ...['64k', '96k', '128k', '160k', '192k'].map(bitrate => ({
              Preset: `${envType}_marsha_cmaf_audio_${bitrate}`,
              NameModifier: `_${bitrate}`,
            })),
          ],
        },
        {
          CustomName: 'Thumbnails outputs',
          Name: 'File Group',
          OutputGroupSettings: {
            Type: 'FILE_GROUP_SETTINGS',
            FileGroupSettings: {
              Destination: `s3://${destinationBucket}/${objectKey.replace(
                /\/video\/.*\//,
                '/thumbnails/',
              )}`,
            },
          },
          Outputs: ['144', '240', '480', '720', '1080'].map(size => ({
            Preset: `${envType}_marsha_thumbnail_jpeg_${size}`,
            NameModifier: `_${size}`,
          })),
        },
        {
          CustomName: 'Previews outputs',
          Name: 'File Group',
          OutputGroupSettings: {
            Type: 'FILE_GROUP_SETTINGS',
            FileGroupSettings: {
              Destination: `s3://${destinationBucket}/${objectKey.replace(
                /\/video\/.*\//,
                '/previews/',
              )}`,
            },
          },
          Outputs: [
            {
              Preset: `${envType}_marsha_preview_jpeg_100`,
              NameModifier: '_100',
            },
          ],
        },
      ],
    },
  };

  try {
    const jobData = await new AWS.MediaConvert({
      endpoint: process.env.MEDIA_CONVERT_END_POINT,
    })
      .createJob(params)
      .promise();

    await updateState(objectKey, 'processing');

    console.log(JSON.stringify(jobData, null, 2));
    callback(null, { Job: jobData.Job.Id });
  } catch (error) {
    callback(error);
  }
};
