'use strict';

const encodeTimedTextTrack = require('./src/encodeTimedTextTrack');
const encodeVideo = require('./src/encodeVideo');
const updateState = require('./src/updateState');
const resizeThumbnails = require('./src/resizeThumbnails');
const copyDocument = require('./src/copyDocument');

const READY = 'ready';
const PROCESSING = 'processing';

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const objectKey = event.Records[0].s3.object.key;
  const sourceBucket = event.Records[0].s3.bucket.name;

  const parts = objectKey.split('/');
  const [resourceId, kind, recordId, extendedStamp] = parts;
  if (
    parts.length != 4 ||
    !['document', 'thumbnail', 'timedtexttrack', 'video'].includes(kind)
  ) {
    let error;
    switch (kind) {
      case 'document':
        error =
          'Source document should be uploaded to a folder of the form ' +
          '"{document_id}/document/{document_id}/{stamp}".';
        break;
      case 'thumbnail':
        error =
          'Source thumbnails should be uploaded in a folder of the form ' +
          '"{playlist_id}/thumbnail/{thumbnail_id}/{stamp}".';
        break;
      case 'timedtexttrack':
        error =
          'Source timed text files should be uploaded to a folder of the form ' +
          '"{playlist_id}/timedtexttrack/{timedtext_id}/{stamp}_{language}[_{has_closed_caption}]".';
        break;
      case 'video':
        error =
          'Source videos should be uploaded in a folder of the form ' +
          '"{video_id}/video/{video_id}/{stamp}".';
        break;
      default:
        error = kind
          ? `Unrecognized kind ${kind} in key "${objectKey}".`
          : `Unrecognized key format "${objectKey}"`;
        break;
    }
    callback(error);
    return;
  }

  switch (kind) {
    case 'document':
      try {
        await copyDocument(objectKey, sourceBucket);
        await updateState(objectKey, READY);
      } catch (error) {
        return callback(error);
      }
      console.log(
        `Successfully received and copy document ${objectKey} from ${sourceBucket}.`,
      );
      break;

    case 'thumbnail':
      try {
        await resizeThumbnails(objectKey, sourceBucket);
        await updateState(objectKey, READY);
      } catch (error) {
        return callback(error);
      }
      console.log(
        `Successfully received and resized thumbnail ${objectKey} from ${sourceBucket}.`,
      );
      break;

    case 'timedtexttrack':
      try {
        await encodeTimedTextTrack(objectKey, sourceBucket, extendedStamp);
        await updateState(objectKey, READY);
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
        await updateState(objectKey, PROCESSING);
      } catch (error) {
        return callback(error);
      }
      console.log(JSON.stringify(jobData, null, 2));
      callback(null, { Job: jobData.Job.Id });
      break;
  }
};
