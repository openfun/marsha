'use strict';

const request = require('request-promise-native');
const crypto = require('crypto');

const { ENDPOINT, SHARED_SECRET } = process.env;

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const key = event.detail.userMetadata.ObjectKey;
  const state = event.detail.status === 'COMPLETE' ? 'ready' : 'error';

  const hmac = crypto.createHmac('sha256', SHARED_SECRET);
  hmac.update(key);
  const signature = hmac.digest('hex');

  try {
    await request({
      body: {
        key,
        signature,
        state,
      },
      json: true,
      method: 'POST',
      uri: ENDPOINT,
    });

    console.log(`Confirmed processing for ${key}. New state is (${state}).`);
    callback();
  } catch (error) {
    console.log('into error');
    callback(error);
  }
};
