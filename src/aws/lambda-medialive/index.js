'use strict';

const channelStateChanged = require('./src/channelStateChanged');

exports.handler = async (event, context, callback) => {
  const event_origin = event.event_origin;
  console.log('Received event:', JSON.stringify(event_origin));
  const type = event_origin['detail-type'];

  switch(type) {
    case 'MediaLive Channel State Change':
      try {
        await channelStateChanged(event.channel, event_origin, context);
        callback();
      } catch (error) {
        callback(error);
      }
      break;
    case 'MediaLive Channel Alert':
      // just end the lambda, no treatment expected.
      callback();
      break;
    default:
      callback('Unknown medialive event');
  }
};
