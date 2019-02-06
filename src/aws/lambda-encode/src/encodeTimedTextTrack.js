const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const subsrt = require('@openfun/subsrt');

/**
 * Convert any uploaded timed text track to `.vtt`.
 * Read it from the source bucket where it was uploaded and write the results in the destination
 * bucket as specified from the environment.
 * @param objectKey The S3 key for the uploaded timed text file, taken from the object creation event.
 * @param sourceBucket The name of the bucket where the timed text file was uploaded.
 */
module.exports = async (objectKey, sourceBucket) => {
  const destinationBucket = process.env.S3_DESTINATION_BUCKET;

  const timedTextFile = await s3
    .getObject({ Bucket: sourceBucket, Key: objectKey })
    .promise();

  let vttTimedText;
  try {
    vttTimedText = subsrt.convert(timedTextFile.Body.toString(), {
      format: 'vtt',
    });
  } catch (e) {
    // Log the file as read from S3 to ease debugging
    // Make sure encodeTimedTextTrack fails when timed text conversion fails.
    throw new Error(`Invalid timed text format for ${objectKey}.`);
  }

  await s3
    .putObject({
      Body: vttTimedText,
      Bucket: destinationBucket,
      // Transform the source key to the format expected for destination keys:
      // 630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/timedtexttrack/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735_fr
      // 👆 becomes 👇
      // 630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/timedtext/1542967735_fr
      Key: `${objectKey.replace(/\/timedtexttrack\/.*\//, '/timedtext/')}.vtt`,
    })
    .promise();
};
