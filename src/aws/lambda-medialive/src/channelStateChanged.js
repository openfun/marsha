const AWS = require('aws-sdk');
const { computeSignature, sendRequest } = require('update-state/utils');
const { DISABLE_SSL_VALIDATION, MARSHA_URL, SHARED_SECRET } = process.env;

const mediaLive = new AWS.MediaLive({ apiVersion: '2017-10-14' });

module.exports = async (event) => {
  const status = event.detail.state;

  if (!["RUNNING", "STOPPED"].includes(status)) {
    throw new Error(`Expected status are RUNNING and STOPPED. ${status} received`);
  }

  const arn_regex = /^arn:aws:medialive:.*:.*:channel:(.*)$/

  const arn = event.detail.channel_arn;
  const matches = arn.match(arn_regex);
  
  const channel = await mediaLive.describeChannel({
    ChannelId: matches[1]
  }).promise();

  const videoId = channel.Name.split("_")[0];
  const body = {
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

