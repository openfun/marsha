const AWS = require("aws-sdk");
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
const Jimp = require("jimp");

module.exports = async (objectKey, sourceBucket) => {
  const destinationBucket = process.env.S3_DESTINATION_BUCKET;

  console.log(`Image resizing started for ${objectKey}`);

  const sourceImage = await s3
    .getObject({ Bucket: sourceBucket, Key: objectKey })
    .promise();
  const sizes = [1080, 720, 480, 240, 144];

  for (const size of sizes) {
    const jimpInstance = await Jimp.read(sourceImage.Body);
    const resizedImage = jimpInstance.resize(Jimp.AUTO, size);

    const parts = objectKey.split("/");
    await s3
      .putObject({
        Body: await resizedImage.getBufferAsync(Jimp.MIME_JPEG),
        Bucket: destinationBucket,
        Key: `${parts[0]}/thumbnails/${parts[3]}_${size}.jpg`,
      })
      .promise();
  }
};
