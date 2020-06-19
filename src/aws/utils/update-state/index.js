/**
 * Post an update to the state of an object to any endpoint, using hmac with a shared secret
 * to sign the object key and provide authorization for the request.
 */
const { computeSignature, sendRequest } = require('./utils');

const { ENDPOINT, SHARED_SECRET } = process.env;
const DISABLE_SSL_VALIDATION = JSON.parse(process.env.DISABLE_SSL_VALIDATION)

module.exports = async (key, state, extraParameters={}) => {
  const body = {
    extraParameters,
    key,
    state,
  };

  const signature = computeSignature(SHARED_SECRET, JSON.stringify(body));

  console.log(`Updating state: POST ${ENDPOINT} \n ${JSON.stringify(body)}`);

  await sendRequest(
    body,
    signature,
    DISABLE_SSL_VALIDATION ? false : true,
    ENDPOINT
  );

  console.log(`Updated ${key}. New state is (${state}).`);
};
