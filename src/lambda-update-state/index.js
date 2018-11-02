'use strict';

const updateState = require('./src/updateState');

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const key = event.detail.userMetadata.ObjectKey;
  const state = event.detail.status === 'COMPLETE' ? 'ready' : 'error';

  try {
    await updateState(key, state);
    callback();
  } catch (error) {
    callback(error);
  }
};
