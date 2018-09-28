'use strict';

const AWS = require('aws-sdk');

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
      'Source subtitles should be uploaded to a folder of the form ' +
      '"{playlist_id}/{video_id}/subtitles/{stamp}_{language}[_{has_closed_caption}]".';
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
          CustomName: 'Video DASH outputs',
          Name: 'DASH ISO',
          OutputGroupSettings: {
            Type: 'DASH_ISO_GROUP_SETTINGS',
            DashIsoGroupSettings: {
              HbbtvCompliance: 'NONE',
              SegmentLength: 30,
              FragmentLength: 2,
              SegmentControl: 'SEGMENTED_FILES',
              Destination: `s3://${destinationBucket}/${objectKey.replace(
                /\/video\/.*\//,
                '/dash/',
              )}`,
            },
          },
          Outputs: ['144', '240', '480', '720', '1080'].map(size => ({
            Preset: `${envType}_marsha_video_dash_${size}`,
            NameModifier: `_${size}`,
          })),
        },
        {
          CustomName: 'Video HLS outputs',
          Name: 'Apple HLS',
          OutputGroupSettings: {
            Type: 'HLS_GROUP_SETTINGS',
            HlsGroupSettings: {
              ManifestDurationFormat: 'INTEGER',
              SegmentLength: 10,
              TimedMetadataId3Period: 6,
              CaptionLanguageSetting: 'OMIT',
              TimedMetadataId3Frame: 'PRIV',
              CodecSpecification: 'RFC_4281',
              OutputSelection: 'MANIFESTS_AND_SEGMENTS',
              ProgramDateTimePeriod: 600,
              MinSegmentLength: 0,
              DirectoryStructure: 'SINGLE_DIRECTORY',
              ProgramDateTime: 'EXCLUDE',
              SegmentControl: 'SEGMENTED_FILES',
              ManifestCompression: 'NONE',
              ClientCache: 'ENABLED',
              StreamInfResolution: 'INCLUDE',
              Destination: `s3://${destinationBucket}/${objectKey.replace(
                /\/video\/.*\//,
                '/hls/',
              )}`,
            },
          },
          Outputs: ['144', '240', '480', '720', '1080'].map(size => ({
            Preset: `${envType}_marsha_video_hls_${size}`,
            NameModifier: `_${size}`,
          })),
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

    console.log(JSON.stringify(jobData, null, 2));
    callback(null, { Job: jobData.Job.Id });
  } catch (error) {
    callback(error);
  }
};
