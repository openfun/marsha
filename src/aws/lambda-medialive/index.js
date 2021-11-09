'use strict';

const channelStateChanged = require('./src/channelStateChanged');

exports.handler = async (event, context) => {
  const event_origin = event.event_origin;
  console.log('Received event:', JSON.stringify(event_origin));
  const type = event_origin['detail-type'];

  switch (type) {
    case 'MediaLive Channel State Change':
      return channelStateChanged(event.channel, event_origin, context);
    case 'MediaLive Channel Alert':
      // just end the lambda, no treatment expected.
      return Promise.resolve();
    default:
      return Promise.reject('Unknown medialive event');
  }
};
