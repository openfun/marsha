const AWS = require('aws-sdk');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const framerateConverter = require('./utils/framerateConverter');

const s3 = new AWS.S3({ apiVersion: '2006-03-01', signatureVersion: 'v4' });

/**
 * Build the appropriate parameters object using our presets and pass it along
 * to MediaConvert through the AWS SDK to initiate the job.
 * @param objectKey The S3 key for the uploaded video, taken from the object creation event.
 * @param sourceBucket The name of the bucket where the video was uploaded.
 */
module.exports = async (objectKey, sourceBucket) => {
  const envType = process.env.ENV_TYPE;
  const destinationBucket = process.env.S3_DESTINATION_BUCKET;

  const signedUrl = await s3.getSignedUrlPromise('getObject', {
    Bucket: sourceBucket,
    Expires: 1200,
    Key: objectKey,
  });

  const { stdout, stderr } = await execFile('mediainfo', [
    '--full',
    '--output=JSON',
    signedUrl,
  ]);

  // 29.970 fps
  const framerateSettings = {
    FramerateDenominator: 1001,
    FramerateNumerator: 30000,
  };
  const videoSizesDefinition = [144, 240, 480, 720, 1080];
  const audioBitratesDefinition = [64000, 96000, 128000, 160000, 192000];

  let videoSizes = videoSizesDefinition;
  let audioBitrates = audioBitratesDefinition;

  if (stdout) {
    const mediainfos = JSON.parse(stdout);

    const videoInfo = mediainfos.media.track.find(
      (track) => track['@type'] === 'Video',
    );
    const audioInfo = mediainfos.media.track.find(
      (track) => track['@type'] === 'Audio',
    );

    if (videoInfo) {
      if (videoInfo.hasOwnProperty('Height')) {
        videoSizes = videoSizesDefinition.filter(
          (size) => size <= videoInfo.Height,
        );
        if (videoSizes.length === 0) {
          videoSizes.push(videoSizesDefinition[0]);
        }
      }

      if (videoInfo.hasOwnProperty('FrameRate')) {
        const convertedFramerate = framerateConverter(videoInfo.FrameRate);
        framerateSettings.FramerateDenominator = convertedFramerate.denominator;
        framerateSettings.FramerateNumerator = convertedFramerate.numerator;
      }
    }

    if (audioInfo && audioInfo.hasOwnProperty('BitRate')) {
      audioBitrates = audioBitratesDefinition.filter(
        (bitrate) => bitrate <= audioInfo.BitRate,
      );
      if (audioBitrates.length === 0) {
        audioBitrates.push(audioBitratesDefinition[0]);
      }
    }
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
          Outputs: videoSizes.map((size) => ({
            Preset: `${envType}_marsha_video_mp4_${size}`,
            NameModifier: `_${size}`,
            VideoDescription: {
              CodecSettings: {
                H264Settings: {
                  FramerateDenominator: framerateSettings.FramerateDenominator,
                  FramerateNumerator: framerateSettings.FramerateNumerator,
                },
              },
            },
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
            ...videoSizes.map((size) => ({
              Preset: `${envType}_marsha_cmaf_video_${size}`,
              NameModifier: `_${size}`,
              VideoDescription: {
                CodecSettings: {
                  H264Settings: {
                    FramerateDenominator:
                      framerateSettings.FramerateDenominator,
                    FramerateNumerator: framerateSettings.FramerateNumerator,
                  },
                },
              },
            })),
            ...audioBitrates.map((bitrate) => {
              const bitratePreset = bitrate / 1000;

              return {
                Preset: `${envType}_marsha_cmaf_audio_${bitratePreset}k`,
                NameModifier: `_${bitratePreset}k`,
              };
            }),
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
          Outputs: videoSizes.map((size) => ({
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

  return await new AWS.MediaConvert({
    endpoint: process.env.MEDIA_CONVERT_END_POINT,
  })
    .createJob(params)
    .promise();
};
