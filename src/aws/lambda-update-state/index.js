'use strict';

const updateState = require('./src/updateState');
const updateVideosContentType = require('./src/updateVideosContentType');

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const key = event.detail.userMetadata.ObjectKey;
  const state = event.detail.status === 'COMPLETE' ? 'ready' : 'error';

  try {
    await updateState(key, state);
    if (event.detail.status === 'COMPLETE') {
      const videos = event.detail.outputGroupDetails.find(el => {
        const regex = RegExp('^s3://.*.mp4$');
        return (
          el.type === 'FILE_GROUP' &&
          regex.test(el.outputDetails[0].outputFilePaths[0])
        );
      }).outputDetails;
      await updateVideosContentType(videos);
    }
    callback();
  } catch (error) {
    callback(error);
  }
};
