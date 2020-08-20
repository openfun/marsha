'use strict';

const channelStateChanged = require('./src/channelStateChanged');

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const type = event['detail-type'];

  switch(type) {
    case 'MediaLive Channel State Change':
      try {
        await channelStateChanged(event, context);
        callback();
      } catch (error) {
        callback(error);
      }
      break;
    default:
      callback('Unknown medialive event');
  }
};
