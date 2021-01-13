// This module if all videos are transmuxed to call the update state.
'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const { DESTINATION_BUCKET_NAME } = process.env;

const updateState = require('update-state');

module.exports = async (event) => {
  const expectedFilesResponse = await s3
    .getObject({
      Bucket: DESTINATION_BUCKET_NAME,
      Key: event.expectedFilesKey,
    })
    .promise();

  const expectedFiles = JSON.parse(
    expectedFilesResponse.Body.toString('utf-8'),
  );

  for (const file of expectedFiles.files) {
    try {
      await s3
        .headObject({
          Bucket: DESTINATION_BUCKET_NAME,
          Key: file,
        })
        .promise();
    } catch (error) {
      // the file does not exists, end the lambda without error
      return Promise.resolve(`file ${file} still does not exists`);
    }
  }

  // update state
  return updateState(event.videoEndpoint, 'pending_live', {
    resolutions: expectedFiles.resolutions.map(Number), // force casting resolutions in number
  });
};
