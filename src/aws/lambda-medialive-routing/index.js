'use strict';

const AWS = require('aws-sdk');

const { MEDIALIVE_LAMBDA_NAME } = process.env
const mediaLive = new AWS.MediaLive({ apiVersion: '2017-10-14' });
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});

exports.handler = async (event) => {

  console.log('Received event:', JSON.stringify(event));

  const arn_regex = /^arn:aws:medialive:.*:.*:channel:(.*)$/

  const arn = event.detail.channel_arn;
  const matches = arn.match(arn_regex);

  const channel = await mediaLive.describeChannel({
    ChannelId: matches[1]
  }).promise();

  const complete_lambda_name = `${channel.Tags.environment}-${MEDIALIVE_LAMBDA_NAME}`;

  console.log(`calling lambda ${complete_lambda_name}`);

  return lambda.invokeAsync({
    FunctionName: complete_lambda_name,
    InvokeArgs: JSON.stringify({
      channel,
      event_origin: event
    })
  }).promise();
};
