const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });

const regex = /^.*\/timedtexttrack\/.*$/;

const processTimedTextTracks = async (continuationToken = null) => {
  const params = {
    Bucket: process.env.S3_SOURCE_BUCKET,
  };

  if (continuationToken) {
    params['ContinuationToken'] = continuationToken;
  }

  const data = await s3.listObjectsV2(params).promise();

  data.Contents.map(async (object) => {
    if (regex.test(object.Key)) {
      console.log(object.Key);
      await invokeLambda(object);
    }
  });

  if (data.IsTruncated) {
    await processTimedTextTracks(data.NextContinuationToken);
  }
};

const invokeLambda = async (timedTextTrack) => {
  console.log('invoke lambda');
  await lambda
    .invokeAsync({
      FunctionName: process.env.LAMBDA_CONVERT_NAME,
      InvokeArgs: JSON.stringify({
        Records: [
          {
            s3: {
              object: { key: timedTextTrack.Key },
              bucket: {
                name: process.env.S3_SOURCE_BUCKET,
              },
            },
          },
        ],
      }),
    })
    .promise();
};

module.exports = async () => {
  console.log('execute migration 1');
  await processTimedTextTracks();
};
