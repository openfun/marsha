#!/bin/bash
set -e

declare -r DESTINATION_BUCKET_REGION="${DESTINATION_BUCKET_REGION:-"eu-west-1"}"

echo "Extracting .ts files from the manifest"
curl -s "${HLS_MANIFEST_ENDPOINT}" | grep "^slice_.*.ts$" | awk -v harvested_files_directory="${HARVESTED_FILES_DIRECTORY}"  '{print "file ", harvested_files_directory$1}' > ts_files.txt
echo "Transmuxing video ${OUPUT_MP4_FILENAME}"
ffmpeg -v error -protocol_whitelist 'https,file,tls,tcp' -f concat -safe 0 -i ts_files.txt -codec copy -f mp4 "${OUPUT_MP4_FILENAME}"
echo "Generating thumbnail ${OUTPUT_THUMBNAIL_FILENAME}"
ffmpeg -v error -ss 00:00:01.000 -i "${HLS_MANIFEST_ENDPOINT}" -vframes 1 "${OUTPUT_THUMBNAIL_FILENAME}"
echo "Copying ${OUPUT_MP4_FILENAME} to s3"
aws s3 cp "./${OUPUT_MP4_FILENAME}" "s3://${DESTINATION_BUCKET_NAME}/${VIDEO_BUCKET_KEY}" --region "${DESTINATION_BUCKET_REGION}"
echo "Copying ${OUTPUT_THUMBNAIL_FILENAME} to s3"
aws s3 cp "./${OUTPUT_THUMBNAIL_FILENAME}" "s3://${DESTINATION_BUCKET_NAME}/${THUMBNAIL_BUCKET_KEY}" --region "${DESTINATION_BUCKET_REGION}"

echo "Invoking the lambda to check if all videos are transmuxed"
aws lambda invoke \
  --cli-binary-format raw-in-base64-out \
  --function-name "${LAMBDA_FUNCTION_NAME}" \
  --invocation-type Event \
  --payload "{ \"detail-type\": \"check\", \"expectedFilesKey\": \"${EXPECTED_FILES_NAME}\", \"videoEndpoint\": \"${VIDEO_ENDPOINT}\"}" \
  response.json

cat response.json
