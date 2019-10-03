const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });

const regex = /^.*\/timedtexttrack\/.*$/

const processTimedTextTracks = (marker = null) => {

  const params = {
    Bucket: process.env.S3_SOURCE_BUCKET,
  };

  if (marker) {
    params['Marker'] = marker;
  }

  s3.listObjects(params, (error, data) => {
    if (error) {
      throw error;
    }

    data.Contents.map(object => {
      if (regex.test(object.Key)) {
        console.log(object.Key);
        invokeLambda(object);
      }
    });

    if (data.IsTruncated) {
      processTimedTextTracks(data.NextMarker);
    }
  });
}

const invokeLambda = timedTextTrack => {
  console.log("invoke lambda");
  const request =  lambda.invokeAsync({
    FunctionName: process.env.LAMBDA_ENCODE_NAME,
    InvokeArgs: {
      Records: [{
        s3: {
          object: {key: timedTextTrack.Key},
          bucket: {
            name: process.env.S3_SOURCE_BUCKET
          },
        }
      }]
    }
  });
  request.send();
}

module.exports = () => {
  console.log("execute migration 1");
  processTimedTextTracks();
};
