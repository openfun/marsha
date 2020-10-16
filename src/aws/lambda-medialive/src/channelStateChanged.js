const { computeSignature, sendRequest } = require('update-state/utils');
const { DISABLE_SSL_VALIDATION, MARSHA_URL, SHARED_SECRET } = process.env;

module.exports = async (channel, event, context) => {
  const status = event.detail.state;

  if (!["RUNNING", "STOPPED"].includes(status)) {
    throw new Error(`Expected status are RUNNING and STOPPED. ${status} received`);
  }

  const videoId = channel.Name.split("_")[1];
  const body = {
    logGroupName: context.logGroupName,
    state: status.toLowerCase(),
  };

  const signature = computeSignature(SHARED_SECRET, JSON.stringify(body));

  return await sendRequest(
    body,
    signature,
    DISABLE_SSL_VALIDATION ? false : true,
    `${MARSHA_URL}/api/videos/${videoId}/update-live-state/`,
    'PATCH'
  );  
};

