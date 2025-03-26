"use strict";

const transferEnded = require("./src/transferEnded");

const url = require("url");

const transferClassroomRecording = require("./src/transferClassroomRecording");

exports.handler = async (event, context, callback) => {
  const body = event.body ? JSON.parse(event.body) : {};

  if (!body.recordUrl || !body.vodKey || !body.bucket) {
    return callback(
      new Error(
        "transferClassroomRecording should contain recordUrl, vodKey and bucket parameters.",
      ),
    );
  }
  const { recordUrl, vodKey, bucket } = body;

  try {
    await transferClassroomRecording(recordUrl, vodKey, bucket);
    await transferEnded(vodKey);
  } catch (error) {
    return callback(error);
  }
  console.log(
    `Successfully received and copied classroom recording ${vodKey} from ${recordUrl} to ${bucket}.`,
  );

  return callback(undefined, {
    statusCode: 201,
    body: {
      message: `Successfully received and transferred classroom recording.`,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// This part will execute when testing locally, but not when the function is deployed online
if ("file://" + __filename === url.pathToFileURL(process.argv[1]).href) {
  import("@scaleway/serverless-functions").then((scw_fnc_node) => {
    scw_fnc_node.serveHandler(exports.handler, 9010);
  });
}
