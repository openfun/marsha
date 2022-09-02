// Copy a Markdown image from a source to a destination bucket
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

module.exports = async (objectKey, sourceBucket) => {
  const destinationBucket = process.env.S3_DESTINATION_BUCKET;
  // objectKey like /<markdown_document_uid>/markdown-image/<image_uid>.<extension>

  console.log(`Copying markdown image ${objectKey} to destination bucket.`);

  return s3
    .copyObject({
      Bucket: destinationBucket,
      Key: objectKey,
      CopySource: `${sourceBucket}/${objectKey}`,
    })
    .promise();
};
