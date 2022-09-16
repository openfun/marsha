const AWS = require("aws-sdk");
const s3 = new AWS.S3();

const subsrt = require("@openfun/subsrt");
const he = require("he");
const updateState = require('update-state');

const READY = "ready";
const ERROR = "error";

/**
 * Convert any uploaded timed text track to `.vtt`.
 * Read it from the source bucket where it was uploaded and write the results in the destination
 * bucket as specified from the environment.
 * @param objectKey The S3 key for the uploaded timed text file, taken from the object creation event.
 * @param sourceBucket The name of the bucket where the timed text file was uploaded.
 * @param filename The timed text track filename with this pattern timestampe_language[_mode]
 */
module.exports = async (objectKey, sourceBucket, filename) => {
  const destinationBucket = process.env.S3_DESTINATION_BUCKET;

  const timedTextFile = await s3
    .getObject({ Bucket: sourceBucket, Key: objectKey })
    .promise();

  const matches = filename.match(/[0-9]{10}_[a-z-]{2,10}_(st|ts|cc)/);
  const mode = (matches && matches[1]) || null;

  let encodedVttTimedText;
  try {
    switch (mode) {
      case "st":
      case "cc":
        encodedVttTimedText = convertTimedTextTrack(timedTextFile, objectKey);
        break;
      default:
        encodedVttTimedText = encodeTranscript(timedTextFile, objectKey);
        break;
    }
  } catch (e) {
    return updateState(objectKey, ERROR);
  }

  await s3
    .putObject({
      Body: encodedVttTimedText,
      Bucket: destinationBucket,
      ContentType: "text/vtt",
      // Transform the source key to the format expected for destination keys:
      // 630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/timedtexttrack/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735_fr
      // 👆 becomes 👇
      // 630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/timedtext/1542967735_fr.vtt
      Key: `${objectKey.replace(/\/timedtexttrack\/.*\//, "/timedtext/")}.vtt`,
    })
    .promise();

  await s3
    .copyObject({
      Bucket: destinationBucket,
      Key: `${objectKey.replace(
        /\/timedtexttrack\/.*\//,
        "/timedtext/source/"
      )}`,
      CopySource: `${sourceBucket}/${objectKey}`,
    })
    .promise();

  return updateState(objectKey, READY, {
    extension: subsrt.detect(timedTextFile.Body.toString()),
  });
};

const convertTimedTextTrack = (timedTextFile, objectKey) => {
  try {
    return subsrt.convert(timedTextFile.Body.toString(), {
      format: "vtt",
    });
  } catch (e) {
    // Log the file as read from S3 to ease debugging
    // Make sure encodeTimedTextTrack fails when timed text conversion fails.
    throw new Error(`Invalid timed text format for ${objectKey}.`);
  }
};

const encodeTranscript = (timedTextFile, objectKey) => {
  // first parse any substitle file in captions formatted for VTT
  let captions;
  try {
    captions = subsrt.parse(timedTextFile.Body.toString(), {
      format: "vtt",
    });
  } catch (e) {
    // Log the file as read from S3 to ease debugging
    // Make sure encodeTimedTextTrack fails when timed text conversion fails.
    throw new Error(`Invalid timed text format for ${objectKey}.`);
  }

  const encodedCaptions = captions.map((caption) => {
    // meta caption does not have data, nothing to encode here we directly return it
    if (caption.type == "meta") {
      return caption;
    }

    // caption.content contains the raw string. We choose to use this property instead of
    // caption.text because substr strips HTML tags before setting this property.
    // First we decode it to avoid double escaping issue and set the value
    // in caption.text because this is the property used in substr.build to create
    // the final WebVTT subtitle.
    caption.text = he.decode(caption.content);
    // Then the text is only escaped, we don't want to encode everything
    caption.text = he.escape(caption.text);

    return caption;
  });

  return subsrt.build(encodedCaptions, { format: "vtt" });
};
