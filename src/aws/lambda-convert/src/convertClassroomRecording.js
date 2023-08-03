// Converts a classroom recording to a vod
// The recording mp4 file is streamed to the source bucket as a regular video
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const stream = require('stream');
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

module.exports = async (recordUrl, vodKey, sourceBucket) => {
  console.log('Converting classroom recording to vod', {
    recordUrl,
    vodKey,
    sourceBucket,
  });

  const recordPage = await fetch(recordUrl, {
    redirect: 'manual',
  });
  let videoStream;
  const contentType = recordPage.headers.get('Content-Type');
  if (contentType.startsWith('video')) {
    videoStream = recordPage;
  } else {
    videoStream = await getVideoStreamFromPlayback(recordPage);
  }
  const passThrough = new stream.PassThrough();
  videoStream.body.pipe(passThrough);
  return s3
    .upload({
      Bucket: sourceBucket,
      Key: vodKey,
      Body: passThrough,
    })
    .promise();
};

const getVideoStreamFromPlayback = async (redirectedResponse) => {
  const cookies = redirectedResponse.headers.get('set-cookie') || '';
  const rawCookie = cookies.split(';');
  const locationURL = new URL(
    redirectedResponse.headers.get('location').replace('http:', 'https:'),
    redirectedResponse.url.replace('http:', 'https:'),
  );
  // Follow redirection to the playback page
  const playbackPage = await fetch(locationURL, {
    headers: {
      Cookie: rawCookie[0],
    },
    redirect: 'manual',
  });

  // Follow redirection to the html video page
  const videoLocationUrl = new URL(
    playbackPage.headers.get('location').replace('http:', 'https:'),
    playbackPage.url.replace('http:', 'https:'),
  );
  const videoPage = await fetch(videoLocationUrl, {
    headers: {
      Cookie: rawCookie[0],
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Cache-Control': 'no-cache',
    },
    redirect: 'manual',
  });
  const baseUrl = videoPage.url.replace(/\/$/, '');
  const { document } = new JSDOM(await videoPage.text()).window;
  const source = document.querySelector('source');
  const videoUrl = `${baseUrl}/${source.src}`;
  const videoStream = await fetch(videoUrl, {
    headers: {
      Cookie: rawCookie[0],
    },
    redirect: 'manual',
  });
  return videoStream;
};
