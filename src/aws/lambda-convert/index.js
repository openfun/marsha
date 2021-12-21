"use strict";

const updateState = require("update-state");

const encodeTimedTextTrack = require("./src/encodeTimedTextTrack");
const encodeVideo = require("./src/encodeVideo");
const resizeThumbnails = require("./src/resizeThumbnails");
const convertSharedLiveMedia = require("./src/convertSharedLiveMedia");
const copyDocument = require("./src/copyDocument");

const READY = "ready";
const PROCESSING = "processing";

exports.handler = async (event, context, callback) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const objectKey = event.Records[0].s3.object.key;
  const sourceBucket = event.Records[0].s3.bucket.name;

  const parts = objectKey.split("/");
  const [resourceId, kind, recordId, extendedStamp] = parts;
  if (
    parts.length != 4 ||
    ![
      "document",
      "sharedlivemedia",
      "thumbnail",
      "timedtexttrack",
      "video",
    ].includes(kind)
  ) {
    let error;
    switch (kind) {
      case "document":
        error =
          "Source document should be uploaded to a folder of the form " +
          '"{document_id}/document/{document_id}/{stamp}".';
        break;
      case "sharedlivemedia":
        error =
          "Source sharedlivemedia should be uploaded to a folder of the form " +
          '"{video_id}/sharedlivemedia/{sharedlivemedia_id}/{stamp}.{extension}".';
        break;
      case "thumbnail":
        error =
          "Source thumbnails should be uploaded in a folder of the form " +
          '"{playlist_id}/thumbnail/{thumbnail_id}/{stamp}".';
        break;
      case "timedtexttrack":
        error =
          "Source timed text files should be uploaded to a folder of the form " +
          '"{playlist_id}/timedtexttrack/{timedtext_id}/{stamp}_{language}[_{has_closed_caption}]".';
        break;
      case "video":
        error =
          "Source videos should be uploaded in a folder of the form " +
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
    case "document":
      try {
        await copyDocument(objectKey, sourceBucket);
        await updateState(objectKey, READY);
      } catch (error) {
        return callback(error);
      }
      console.log(
        `Successfully received and copy document ${objectKey} from ${sourceBucket}.`
      );
      break;

    case "sharedlivemedia":
      try {
        const { nbPages, extension } = await convertSharedLiveMedia(
          objectKey,
          sourceBucket
        );
        await updateState(objectKey, READY, { nbPages, extension });
      } catch (error) {
        return callback(error);
      }
      console.log(
        `Successfully received and converted sharedlivemedia ${objectKey} from ${sourceBucket}.`
      );
      break;

    case "thumbnail":
      try {
        await resizeThumbnails(objectKey, sourceBucket);
        await updateState(objectKey, READY);
      } catch (error) {
        return callback(error);
      }
      console.log(
        `Successfully received and resized thumbnail ${objectKey} from ${sourceBucket}.`
      );
      break;

    case "timedtexttrack":
      try {
        const extension = await encodeTimedTextTrack(
          objectKey,
          sourceBucket,
          extendedStamp
        );
        await updateState(objectKey, READY, { extension });
      } catch (error) {
        return callback(error);
      }
      console.log(
        `Successfully received and encoded timedtexttrack ${objectKey} from ${sourceBucket}.`
      );
      break;

    case "video":
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
