// Convert a sharedlivemedia from a source to a destination bucket
const AWS = require("aws-sdk");
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
const { Poppler } = require("node-poppler");

module.exports = async (objectKey, sourceBucket) => {
  const destinationBucket = process.env.S3_DESTINATION_BUCKET;

  console.log(`Converting sharedlivemedia ${objectKey} to destination bucket.`);

  const sourceSharedliveMedia = await s3
    .getObject({ Bucket: sourceBucket, Key: objectKey })
    .promise();

  const poppler = new Poppler("/usr/local/bin");
  const pdfInfos = await poppler.pdfInfo(sourceSharedliveMedia.Body, {
    printAsJson: true,
  });
  const nbPages = parseInt(pdfInfos.pages);
  const parts = objectKey.split("/");
  const videoId = parts[0];
  const sharedliveMediaId = parts[2];
  const [stamp, extension] = parts[3].split(".");

  return Promise.all(
    Array.from({ length: nbPages }, (_, i) => i + 1).map(async (page) => {
      console.log(`Converting page ${page} of ${nbPages}`);
      const options = {
        svgFile: true,
        firstPageToConvert: page,
        lastPageToConvert: page,
      };
      const outputBuffer = await poppler.pdfToCairo(
        sourceSharedliveMedia.Body,
        undefined,
        options
      );
      await s3
        .putObject({
          Body: Buffer.from(outputBuffer),
          Bucket: destinationBucket,
          Key: `${videoId}/sharedlivemedia/${sharedliveMediaId}/${stamp}_${page}.svg`,
        })
        .promise();
    })
  ).then(() => ({ nbPages, extension }));
};
