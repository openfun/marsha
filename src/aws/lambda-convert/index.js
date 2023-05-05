'use strict';

const updateState = require('update-state');

const encodeTimedTextTrack = require('./src/encodeTimedTextTrack');
const encodeVideo = require('./src/encodeVideo');
const resizeThumbnails = require('./src/resizeThumbnails');
const convertSharedLiveMedia = require('./src/convertSharedLiveMedia');
const copyDocument = require('./src/copyDocument');
const copyMarkdownImage = require('./src/copyMarkdownImage');
const scanDepositedFile = require('./src/scanDepositedFile');
const copyClassroomDocument = require('./src/copyClassroomDocument');
const convertClassroomRecording = require('./src/convertClassroomRecording');

const READY = 'ready';
const PROCESSING = 'processing';

const ResourceKindEnum = {
  CLASSROOM_DOCUMENT_KIND: 'classroomdocument',
  DEPOSITED_FILE_KIND: 'depositedfile',
  DOCUMENT_KIND: 'document',
  MARKDOWN_IMAGE_KIND: 'markdown-image',
  SHARED_LIVE_MEDIA_KIND: 'sharedlivemedia',
  THUMBNAIL_KIND: 'thumbnail',
  TIMED_TEXT_TRACK_KIND: 'timedtexttrack',
  VIDEO_KIND: 'video',
};

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  if (event.type && event.type === 'convertClassroomRecording') {
    if (
      !event.parameters ||
      !event.parameters.recordUrl ||
      !event.parameters.vodKey ||
      !event.parameters.sourceBucket
    ) {
      callback(
        'convertClassroomRecording should contain recordUrl, vodKey and sourceBucket parameters.',
      );
      return;
    }

    const { recordUrl, vodKey, sourceBucket } = event.parameters;

    try {
      await convertClassroomRecording(recordUrl, vodKey, sourceBucket);
    } catch (error) {
      return callback(error);
    }
    console.log(
      `Successfully received and converted classroom recording ${vodKey} from ${recordUrl}.`,
    );

    return;
  }

  const objectKey = event.Records[0].s3.object.key;
  const sourceBucket = event.Records[0].s3.bucket.name;

  const parts = objectKey.split('/');
  const [resourceId, kind, recordId, extendedStamp] = parts;

  if (parts.length !== 4 || !Object.values(ResourceKindEnum).includes(kind)) {
    let error;
    switch (kind) {
      case ResourceKindEnum.CLASSROOM_DOCUMENT_KIND:
        error =
          'Source classroomdocument should be uploaded to a folder of the form ' +
          '"{classroom_id}/classroomdocument/{classroomdocument_id}/{stamp}".';
        break;
      case ResourceKindEnum.DEPOSITED_FILE_KIND:
        error =
          'Source depositedfile should be uploaded to a folder of the form ' +
          '"{file-deposit_id}/depositedfile/{depositedfile_id}/{stamp}".';
        break;
      case ResourceKindEnum.DOCUMENT_KIND:
        error =
          'Source document should be uploaded to a folder of the form ' +
          '"{document_id}/document/{document_id}/{stamp}".';
        break;
      case ResourceKindEnum.MARKDOWN_IMAGE_KIND:
        error =
          'Source markdown image should be uploaded to a folder of the form ' +
          '"{markdown_document_id}/markdown-images/{markdown_image_id}/{stamp}.{extension}".';
        break;
      case ResourceKindEnum.SHARED_LIVE_MEDIA_KIND:
        error =
          'Source sharedlivemedia should be uploaded to a folder of the form ' +
          '"{video_id}/sharedlivemedia/{sharedlivemedia_id}/{stamp}.{extension}".';
        break;
      case ResourceKindEnum.THUMBNAIL_KIND:
        error =
          'Source thumbnails should be uploaded in a folder of the form ' +
          '"{playlist_id}/thumbnail/{thumbnail_id}/{stamp}".';
        break;
      case ResourceKindEnum.TIMED_TEXT_TRACK_KIND:
        error =
          'Source timed text files should be uploaded to a folder of the form ' +
          '"{playlist_id}/timedtexttrack/{timedtext_id}/{stamp}_{language}[_{has_closed_caption}]".';
        break;
      case ResourceKindEnum.VIDEO_KIND:
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
    case ResourceKindEnum.CLASSROOM_DOCUMENT_KIND:
      try {
        await copyClassroomDocument(objectKey, sourceBucket);
        await updateState(objectKey, READY);
      } catch (error) {
        return callback(error);
      }
      console.log(
        `Successfully received and copy classroom document ${objectKey} from ${sourceBucket}.`,
      );
      break;
    case ResourceKindEnum.DEPOSITED_FILE_KIND:
      try {
        await scanDepositedFile(objectKey, sourceBucket);
      } catch (error) {
        return callback(error);
      }
      console.log(
        `Successfully received and copy deposited file ${objectKey} from ${sourceBucket}.`,
      );
      break;
    case ResourceKindEnum.DOCUMENT_KIND:
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

    case ResourceKindEnum.MARKDOWN_IMAGE_KIND:
      try {
        await copyMarkdownImage(objectKey, sourceBucket);
        await updateState(objectKey, READY);
      } catch (error) {
        return callback(error);
      }
      console.log(
        `Successfully received and copy markdown image ${objectKey} from ${sourceBucket}.`,
      );
      break;

    case ResourceKindEnum.SHARED_LIVE_MEDIA_KIND:
      try {
        await updateState(objectKey, PROCESSING);
        const { nbPages, extension } = await convertSharedLiveMedia(
          objectKey,
          sourceBucket,
        );
        await updateState(objectKey, READY, { nbPages, extension });
      } catch (error) {
        return callback(error);
      }
      console.log(
        `Successfully received and converted sharedlivemedia ${objectKey} from ${sourceBucket}.`,
      );
      break;

    case ResourceKindEnum.THUMBNAIL_KIND:
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

    case ResourceKindEnum.TIMED_TEXT_TRACK_KIND:
      try {
        await encodeTimedTextTrack(objectKey, sourceBucket, extendedStamp);
      } catch (error) {
        return callback(error);
      }
      console.log(
        `Successfully received and encoded timedtexttrack ${objectKey} from ${sourceBucket}.`,
      );
      break;

    case ResourceKindEnum.VIDEO_KIND:
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
