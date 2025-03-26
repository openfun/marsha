/**
 * Post to an action endpoint to inform the end of the video upload to S3.
 */
const { computeSignature, sendRequest } = require("./utils");

const { MARSHA_BASE_URL, SHARED_SECRET } = process.env;
const DISABLE_SSL_VALIDATION = JSON.parse(process.env.DISABLE_SSL_VALIDATION);

module.exports = async (vodKey) => {
  const body = {
    file_key: vodKey,
  };

  const signature = computeSignature(SHARED_SECRET, JSON.stringify(body));

  // Extract videoId from vodKey: "{base}/{videoId}/video/{stamp}"
  const [, videoId] = vodKey.split("/");

  const API_ENDPOINT = `${MARSHA_BASE_URL}/videos/${videoId}/transfer-ended/`;

  console.log(
    `Video transfer ended: POST ${API_ENDPOINT} \n ${JSON.stringify(body)}`,
  );

  return sendRequest(body, signature, !DISABLE_SSL_VALIDATION, API_ENDPOINT);
};
