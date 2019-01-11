'use strict';

const encodeTimedTextTrack = require('./src/encodeTimedTextTrack');
const encodeVideo = require('./src/encodeVideo');
const updateState = require('./src/updateState');

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const objectKey = event.Records[0].s3.object.key;
  const sourceBucket = event.Records[0].s3.bucket.name;

  const parts = objectKey.split('/');
  const [resourceId, kind, recordId, extendedStamp] = parts;
  if (parts.length != 4 || !['timedtexttrack', 'video'].includes(kind)) {
    let error =
      kind === 'video'
        ? 'Source videos should be uploaded in a folder of the form ' +
          '"{playlist_id}/videos/{video_id}/{stamp}".'
        : kind === 'timedtexttrack'
        ? 'Source timed text files should be uploaded to a folder of the form ' +
          '"{playlist_id}/timedtexttrack/{timedtext_id}/{stamp}_{language}[_{has_closed_caption}]".'
        : kind
        ? `Unrecognized kind ${kind} in key "${objectKey}".`
        : `Unrecognized key format "${objectKey}"`;
    callback(error);
    return;
  }

  switch (kind) {
    case 'timedtexttrack':
      try {
        await encodeTimedTextTrack(objectKey, sourceBucket);
        await updateState(objectKey, 'ready');
      } catch (error) {
        return callback(error);
      }
      console.log(
        `Successfully received and encoded timedtexttrack ${objectKey} from ${sourceBucket}.`,
      );
      break;

    case 'video':
      let jobData;
      try {
        jobData = await encodeVideo(objectKey, sourceBucket);
        await updateState(objectKey, 'processing');
      } catch (error) {
        return callback(error);
      }
      console.log(JSON.stringify(jobData, null, 2));
      callback(null, { Job: jobData.Job.Id });
      break;
  }
};
