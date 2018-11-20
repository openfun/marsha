'use strict';

const encodeVideo = require('./src/encodeVideo');
const updateState = require('./src/updateState');

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const objectKey = event.Records[0].s3.object.key;
  const sourceBucket = event.Records[0].s3.bucket.name;

  if (objectKey.split('/').length != 4) {
    let error =
      'Source videos should be uploaded in a folder of the form ' +
      '"{playlist_id}/{video_id}/videos/{stamp}".' +
      'Source timed text files should be uploaded to a folder of the form ' +
      '"{playlist_id}/{video_id}/timedtext/{stamp}_{language}[_{mode}]".';
    callback(error);
    return;
  }

  try {
    await encodeVideo(objectKey, sourceBucket);

    await updateState(objectKey, 'processing');

    console.log(JSON.stringify(jobData, null, 2));
    callback(null, { Job: jobData.Job.Id });
  } catch (error) {
    callback(error);
  }
};
