// Copy a document from a source to a destination bucket
const AWS = require("aws-sdk");
const subsrt = require("@openfun/subsrt");
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

module.exports = async (objectKey, sourceBucket) => {
  const destinationBucket = process.env.S3_DESTINATION_BUCKET;

  console.log(`Scanning depositedfile ${objectKey} for viruses.`);

  console.log(`Copying depositedfile ${objectKey} to destination bucket.`);

  const parts = objectKey.split("/");
  const fileDeposit = parts[0];
  const depositedFile = parts[2];
  const [stamp, extension] = parts[3].split(".");

  await s3
    .copyObject({
      Bucket: destinationBucket,
      Key: `${fileDeposit}/depositedfile/${depositedFile}/${stamp}.${extension}`,
      CopySource: `${sourceBucket}/${objectKey}`,
    })
    .promise();

  return Promise.resolve({ extension });
};
