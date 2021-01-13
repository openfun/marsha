'use strict';

const medialive = require('./src/medialive');
const mediapackage = require('./src/mediapackage');

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));
  switch (event.source) {
    case 'aws.medialive':
      return medialive(event);
    case 'aws.mediapackage':
      return mediapackage(event);
    default:
      return Promise.reject(
        new Error(`Source "${event.source}" not managed by this lambda"`),
      );
  }
};
