'use strict';

const AWS = require('aws-sdk');
const crypto = require('crypto');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const rmdir = util.promisify(fs.rmdir);

const updateState = require('update-state');

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  httpOptions: { timeout: 15 * 60 * 1000 },
});

module.exports = async (event) => {
  const resolutions = Object.keys(event.filesToProcess);

  await Promise.all(
    resolutions.map(async (resolution) => {
      const multipartUpload = await s3
        .createMultipartUpload({
          Bucket: event.destinationBucketName,
          Key: event.filesToProcess[resolution].video.key,
          ContentType: 'video/mp4',
        })
        .promise();
      const videoFileStream = fs.createReadStream(
        event.filesToProcess[resolution].video.filename,
        {
          highWaterMark: 10 * 1024 * 1024, // 10 MB
        },
      );

      let part = 1;
      const uploadedParts = [];
      for await (const chunk of videoFileStream) {
        const hash = crypto.createHash('md5');
        hash.update(chunk);
        const uploadedPart = await s3
          .uploadPart({
            Bucket: event.destinationBucketName,
            Key: event.filesToProcess[resolution].video.key,
            PartNumber: part,
            Body: chunk,
            ContentMD5: hash.digest('base64'),
            UploadId: multipartUpload.UploadId,
          })
          .promise();
        uploadedParts.push({
          ETag: uploadedPart.ETag,
          PartNumber: part,
        });
        part++;
      }
      await s3
        .completeMultipartUpload({
          Bucket: event.destinationBucketName,
          Key: event.filesToProcess[resolution].video.key,
          MultipartUpload: {
            Parts: uploadedParts,
          },
          UploadId: multipartUpload.UploadId,
        })
        .promise();

      await s3
        .putObject({
          Body: await readFile(
            event.filesToProcess[resolution].thumbnail.filename,
          ),
          Bucket: event.destinationBucketName,
          Key: event.filesToProcess[resolution].thumbnail.key,
          ContentType: 'image/jpeg',
        })
        .promise();
    }),
  );
  // delete everything
  await rmdir(event.videoBaseDirectory, { recursive: true });

  return updateState(
    `${event.videoId}/video/${event.videoId}/${event.videoStamp}`,
    'pending_live',
    {
      resolutions: resolutions.map(Number), // force casting resolutions in number
    },
  );
};
