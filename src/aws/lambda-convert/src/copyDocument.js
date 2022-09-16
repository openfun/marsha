// Copy a document from a source to a destination bucket
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

module.exports = async (objectKey, sourceBucket) => {
  const destinationBucket = process.env.S3_DESTINATION_BUCKET;

  console.log(`Copying document ${objectKey} to destination bucket.`);

  const parts = objectKey.split('/');
  return s3
    .copyObject({
      Bucket: destinationBucket,
      Key: `${parts[0]}/document/${parts[3]}`,
      CopySource: `${sourceBucket}/${objectKey}`,
    })
    .promise();
};
