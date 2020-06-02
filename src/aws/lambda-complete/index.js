'use strict';

const updateState = require('update-state');

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const key = event.detail.userMetadata.ObjectKey;
  const state = event.detail.status === 'COMPLETE' ? 'ready' : 'error';
  let extraParameters = {};
  if (event.detail.status === 'COMPLETE') {
    const resolutions = event
      .detail
      .outputGroupDetails.find(outputGroupDetail => outputGroupDetail.type === "FILE_GROUP")
      .outputDetails.map(outputDetail => outputDetail.videoDetails.heightInPx);

    extraParameters = {resolutions}
  }

  try {
    await updateState(key, state, extraParameters);
    callback();
  } catch (error) {
    callback(error);
  }
};
