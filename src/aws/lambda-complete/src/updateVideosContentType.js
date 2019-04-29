const AWS = require('aws-sdk');
const url = require('url');

const s3 = new AWS.S3();

module.exports = async videos => {
  console.log('Start updating Content-Type to binary/octet-stream');
  for (const video of videos) {
    for (const origin of video.outputFilePaths) {
      const parsedUrl = url.parse(origin);

      const params = {
        Bucket: parsedUrl.host,
        CopySource: `/${parsedUrl.host}${parsedUrl.path}`,
        Key: parsedUrl.path.substring(1),
        ContentType: 'binary/octet-stream',
        MetadataDirective: 'REPLACE', // force to replace metadata. Without this copy will fail !
      };

      await s3
        .copyObject(params, (err, data) => {
          if (err) {
            console.log(
              `An error occured trying to update Content-Type to binary/octet-stream of ${origin}`,
            );
            console.log(err, err.stack);
          }
        })
        .promise();
    }
  }
};
