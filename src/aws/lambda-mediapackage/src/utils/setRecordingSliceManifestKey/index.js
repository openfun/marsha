/**
 * Get the record slices states for a video, using hmac with a shared secret
 * to sign the object key and provide authorization for the request.
 */
const { computeSignature, sendRequest } = require('update-state/utils');

const { RECORDING_SLICES_MANIFEST_ENDPOINT, SHARED_SECRET } = process.env;
const DISABLE_SSL_VALIDATION = JSON.parse(process.env.DISABLE_SSL_VALIDATION);

module.exports = async (videoId, harvestJobId, manifestKey) => {
  const body = {
    video_id: videoId,
    harvest_job_id: harvestJobId,
    manifest_key: manifestKey,
  };

  const signature = computeSignature(SHARED_SECRET, JSON.stringify(body));

  console.log(
    `Setting manifest for harvesting job Checking video record slices states: POST ${RECORDING_SLICES_MANIFEST_ENDPOINT} \n
     ${JSON.stringify(body)}`,
  );

  return sendRequest(
    body,
    signature,
    !DISABLE_SSL_VALIDATION,
    RECORDING_SLICES_MANIFEST_ENDPOINT,
    'POST',
  );
};
