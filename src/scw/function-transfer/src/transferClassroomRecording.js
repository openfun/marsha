// Transfer a classroom recording to Scaleway S3
// The recording mp4 file is streamed to the bucket as a regular video
const AWS = require("aws-sdk");
const stream = require("stream");
const fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const s3 = new AWS.S3({
  endpoint: `https://s3.${process.env.S3_REGION}.scw.cloud`,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

module.exports = async (recordUrl, vodKey, bucket) => {
  console.log("Transferring classroom recording to the S3 bucket", {
    recordUrl,
    vodKey,
    bucket,
  });

  const recordPage = await fetch(recordUrl, {
    redirect: "manual",
  });

  let videoStream;
  const contentType = recordPage.headers.get("Content-Type");
  if (contentType.startsWith("video")) {
    videoStream = recordPage;
  } else {
    videoStream = await getVideoStreamFromPlayback(recordPage);
  }
  const passThrough = new stream.PassThrough();
  videoStream.body.pipe(passThrough);
  return s3
    .upload({
      Bucket: bucket,
      Key: vodKey,
      Body: passThrough,
    })
    .promise();
};

const getVideoStreamFromPlayback = async (redirectedResponse) => {
  const cookies = redirectedResponse.headers.get("set-cookie") || "";
  const rawCookie = cookies.split(";");
  const locationURL = new URL(
    redirectedResponse.headers.get("location").replace("http:", "https:"),
    redirectedResponse.url.replace("http:", "https:"),
  );
  // Follow redirection to the playback page
  const playbackPage = await fetch(locationURL, {
    headers: {
      Cookie: rawCookie[0],
    },
    redirect: "manual",
  });

  // Follow redirection to the html video page
  const videoLocationUrl = new URL(
    playbackPage.headers.get("location").replace("http:", "https:"),
    playbackPage.url.replace("http:", "https:"),
  );
  const videoPage = await fetch(videoLocationUrl, {
    headers: {
      Cookie: rawCookie[0],
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Cache-Control": "no-cache",
    },
    redirect: "manual",
  });
  const baseUrl = videoPage.url.replace(/\/$/, "");
  const { document } = new JSDOM(await videoPage.text()).window;
  const source = document.querySelector("source");
  const videoUrl = `${baseUrl}/${source.src}`;
  const videoStream = await fetch(videoUrl, {
    headers: {
      Cookie: rawCookie[0],
    },
    redirect: "manual",
  });
  return videoStream;
};
