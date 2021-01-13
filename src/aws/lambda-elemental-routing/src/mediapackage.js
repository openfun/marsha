'use strict';

const AWS = require('aws-sdk');
const { MEDIAPACKAGE_LAMBDA_NAME } = process.env;
const lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });

module.exports = async (event) => {
  // The harvest id has this pattern : {environment}_{pk}_{stamp}
  // From the id we can know to which environment route the event to the good lambda
  const elements = event.detail.harvest_job.id.split('_');

  const complete_lambda_name = `${elements[0]}-${MEDIAPACKAGE_LAMBDA_NAME}`;

  console.log(`calling lambda ${complete_lambda_name}`);

  return lambda
    .invoke({
      FunctionName: complete_lambda_name,
      InvocationType: 'Event',
      Payload: JSON.stringify(event),
    })
    .promise();
};
