'use strict';

const harvest = require('./src/harvest');
const transmux = require('./src/transmux');
const concat = require('./src/concat');
const upload = require('./src/upload');

exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event));
  const type = event['detail-type'];

  switch (type) {
    case 'MediaPackage HarvestJob Notification':
      return harvest(event, context.functionName);
    case 'transmux':
      return transmux(event, context.functionName);
    case 'concat':
      return concat(event, context.functionName);
    case 'upload':
      return upload(event);
    default:
      return Promise.reject(
        new Error(`type "${type}" not managed by this lambda"`),
      );
  }
};
