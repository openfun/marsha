'use strict';

const harvest = require('./src/harvest');

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));
  const type = event['detail-type'];

  switch (type) {
    case 'MediaPackage HarvestJob Notification':
      return harvest(event);
    default:
      return Promise.reject(
        new Error(`type "${type}" not managed by this lambda"`),
      );
  }
};
