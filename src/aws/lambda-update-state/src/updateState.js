// DUPLICATE CODE: src/aws/lambda-encode/src/updateState
/**
 * Post an update to the state of an object to any endpoint, using hmac with a shared secret
 * to sign the object key and provide authorization for the request.
 */
const request = require('request-promise-native');
const crypto = require('crypto');

const { ENDPOINT, SHARED_SECRET } = process.env;

module.exports = async (key, state) => {
  const hmac = crypto.createHmac('sha256', SHARED_SECRET);
  hmac.update(key);
  const signature = hmac.digest('hex');

  const body = {
    key,
    signature,
    state,
  };

  console.log(`Updating state: POST ${ENDPOINT} \n ${JSON.stringify(body)}`);

  await request({
    body,
    json: true,
    method: 'POST',
    uri: ENDPOINT,
  });

  console.log(`Updated ${key}. New state is (${state}).`);
};
