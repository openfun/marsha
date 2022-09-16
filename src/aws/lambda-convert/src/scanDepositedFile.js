// Copy a document from a source to a destination bucket
const AWS = require('aws-sdk');
const { writeFileSync } = require('fs');
const NodeClam = require('clamscan');

const updateState = require('update-state');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const COPYING = 'copying';
const ERROR = 'error';
const INFECTED = 'infected';
const READY = 'ready';
const SCANNING = 'scanning';

module.exports = async (objectKey, sourceBucket) => {
  const destinationBucket = process.env.S3_DESTINATION_BUCKET;

  const parts = objectKey.split('/');
  const fileDepositId = parts[0];
  const depositedFileId = parts[2];
  const depositedFilename = parts[3];
  const extension = depositedFilename.split('.')[1] || null;

  console.log(`Scanning depositedfile ${objectKey} for viruses.`);

  await updateState(objectKey, SCANNING);

  const depositedFile = await s3
    .getObject({ Bucket: sourceBucket, Key: objectKey })
    .promise();

  writeFileSync(`/tmp/${depositedFilename}`, depositedFile.Body);

  try {
    // Get instance by resolving ClamScan promise object
    const clamscan = await new NodeClam().init({
      debugMode: true,
      preference: 'clamscan',
    });
    const { isInfected, file, viruses } = await clamscan.isInfected(
      `/tmp/${depositedFilename}`,
    );
    if (isInfected) {
      console.log(`${file} is infected with ${viruses}!`);
      return updateState(objectKey, INFECTED, { error: viruses });
    }
  } catch (err) {
    console.log(err);
    await updateState(objectKey, ERROR, { error: err });
    throw err;
  }

  console.log(`Copying depositedfile ${objectKey} to destination bucket.`);

  await updateState(objectKey, COPYING);

  await s3
    .copyObject({
      Bucket: destinationBucket,
      Key: `${fileDepositId}/depositedfile/${depositedFileId}/${depositedFilename}`,
      CopySource: `${sourceBucket}/${objectKey}`,
    })
    .promise();

  if (extension) {
    return updateState(objectKey, READY, { extension });
  }

  return updateState(objectKey, READY);
};
