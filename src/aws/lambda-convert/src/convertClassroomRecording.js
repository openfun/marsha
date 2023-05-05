// Converts a classroom recording to a vod
// The recording mp4 file is streamed to the source bucket as a regular video
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const stream = require('stream');
const fetch = require('node-fetch');

module.exports = async (recordUrl, vodKey, sourceBucket) => {
  console.log('Converting classroom recording to vod', {
    recordUrl,
    vodKey,
    sourceBucket,
  });

  const videoStream = await fetch(recordUrl);
  const passThrough = new stream.PassThrough();
  videoStream.body.pipe(passThrough);
  return s3
    .upload({
      Bucket: sourceBucket,
      Key: vodKey,
      Body: passThrough,
    })
    .promise();
};
