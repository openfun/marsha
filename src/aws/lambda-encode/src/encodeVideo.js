const AWS = require('aws-sdk');

/**
 * Build the appropriate parameters object using our presets and pass it along
 * to MediaConvert through the AWS SDK to initiate the job.
 * @param objectKey The S3 key for the uploaded video, taken from the object creation event.
 * @param sourceBucket The name of the bucket where the video was uploaded.
 */
module.exports = async (objectKey, sourceBucket) => {
  const envType = process.env.ENV_TYPE;
  const destinationBucket = process.env.S3_DESTINATION_BUCKET;

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

  await new AWS.MediaConvert({
    endpoint: process.env.MEDIA_CONVERT_END_POINT,
  })
    .createJob(params)
    .promise();
};
