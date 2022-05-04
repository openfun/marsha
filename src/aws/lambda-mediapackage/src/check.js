// This module if all videos are transmuxed to call the update state.
'use strict';

const { computeSignature, sendRequest } = require('update-state/utils');

const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const {
  DESTINATION_BUCKET_NAME,
  DISABLE_SSL_VALIDATION,
  MARSHA_URL,
  SHARED_SECRET,
} = process.env;

module.exports = async (event, context) => {
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

  const videoId = event.expectedFilesKey.split('/')[0];
  const body = {
    logGroupName: context.logGroupName,
    requestId: context.awsRequestId,
    state: 'harvested',
    extraParameters: {
      resolutions: expectedFiles.resolutions.map(Number), // force casting resolutions in number
      uploaded_on: event.videoEndpoint.split('/')[3],
    },
  };
  const signature = computeSignature(SHARED_SECRET, JSON.stringify(body));

  return sendRequest(
    body,
    signature,
    DISABLE_SSL_VALIDATION ? false : true,
    `${MARSHA_URL}/api/videos/${videoId}/update-live-state/`,
    'PATCH',
  );
};
