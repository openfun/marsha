/**
 * Builds manifests for given video live record slices and sends them to S3.
 */

const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const { Parser } = require('m3u8-parser');

const { CLOUDFRONT_ENDPOINT, DESTINATION_BUCKET_NAME } = process.env;

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

module.exports = async (environment, pk, stamp, recordSlices = []) => {
  const mainManifestKey = `${pk}/cmaf/${stamp}.m3u8`;

  const mainManifestParser = new Parser();
  const mainManifestsLines = [];
  const subManifests = {};

  for (const recordingSlice of recordSlices) {
    // fetch the harvested manifest content
    const harvestedMainManifestUrl = `https://${CLOUDFRONT_ENDPOINT}/${recordingSlice.manifest_key}`;
    const response = await fetch(harvestedMainManifestUrl);
    const harvestedMainManifest = await response.text();

    console.log('Recording slice:', recordingSlice);
    console.log('Recording slice manifest url:', harvestedMainManifestUrl);
    console.log('Recording slice manifest content:', harvestedMainManifest);

    // parse the manifest
    const hlsParser = new Parser();
    hlsParser.push(harvestedMainManifest);
    hlsParser.end();

    if (mainManifestParser.lineStream.buffer.length === 0) {
      mainManifestParser.push(harvestedMainManifest);
      mainManifestParser.end();
    }

    await Promise.all(
      hlsParser.manifest.playlists.map(async (playlist) => {
        // collect main manifest lines
        const resolution = playlist.attributes.RESOLUTION;
        if (!mainManifestsLines.join().includes(resolution.height)) {
          let attributes = `BANDWIDTH=${playlist.attributes.BANDWIDTH},`;
          attributes += `AVERAGE-BANDWIDTH=${playlist.attributes['AVERAGE-BANDWIDTH']},`;
          attributes += `RESOLUTION=${resolution.width}x${resolution.height},`;
          attributes += `FRAME-RATE=${playlist.attributes['FRAME-RATE']},`;
          attributes += `CODECS="${playlist.attributes['CODECS']}"`;

          mainManifestsLines.push(`#EXT-X-STREAM-INF:${attributes}
${environment}_${pk}_${stamp}_hls_${resolution.height}.m3u8`);
        }

        // fetch the sub manifest content
        const harvestedSubManifestUrl = `https://${CLOUDFRONT_ENDPOINT}/${pk}/cmaf/${recordingSlice.harvested_directory}/${playlist.uri}`;
        const response = await fetch(harvestedSubManifestUrl);
        const harvestedSubManifest = await response.text();

        console.log(
          'Recording slice sub manifest url:',
          harvestedSubManifestUrl,
        );
        console.log(
          'Recording slice sub manifest content:',
          harvestedSubManifest,
        );

        // parse the manifest
        const hlsParser = new Parser();
        hlsParser.push(harvestedSubManifest);
        hlsParser.end();

        if (!subManifests[resolution.height]) {
          subManifests[resolution.height] = {
            parser: new Parser(),
            lines: [],
          };
        } else {
          subManifests[resolution.height].lines.push('#EXT-X-DISCONTINUITY');
        }
        subManifests[resolution.height].lines.push(
          `#EXT-X-MEDIA-SEQUENCE:${hlsParser.manifest.mediaSequence}`,
        );
        subManifests[resolution.height].parser.push(harvestedSubManifest);
        hlsParser.manifest.segments.map((segment) => {
          subManifests[resolution.height].lines.push(
            `#EXTINF:${segment.duration.toFixed(3)},
${recordingSlice.harvested_directory}/${segment.uri}`,
          );
        });
      }),
    );
  }

  const mainManifestBody = `#EXTM3U
#EXT-X-VERSION:${mainManifestParser.manifest.version}
#EXT-X-INDEPENDENT-SEGMENTS
${mainManifestsLines.join('\n')}`;

  console.log('Storing main manifest Bucket:', DESTINATION_BUCKET_NAME);
  console.log('Storing main manifest key:', mainManifestKey);
  console.log('Storing main manifest body:', mainManifestBody);

  const putMainManifest = await s3
    .putObject({
      Bucket: DESTINATION_BUCKET_NAME,
      Key: mainManifestKey,
      Body: mainManifestBody,
      ContentType: 'text/plain',
    })
    .promise();

  console.log('S3 putObject main manifest response:', putMainManifest);

  console.log('subManifests:', subManifests);

  Object.keys(subManifests).forEach((resolution) => {
    const subManifest = subManifests[resolution];
    const subManifestKey = `${pk}/cmaf/${environment}_${pk}_${stamp}_hls_${resolution}.m3u8`;
    const subManifestBody = `#EXTM3U
#EXT-X-VERSION:${subManifest.parser.manifest.version}
#EXT-X-TARGETDURATION:${subManifest.parser.manifest.targetDuration}
#EXT-X-PLAYLIST-TYPE:${subManifest.parser.manifest.playlistType}
${subManifest.lines.join('\n')}
#EXT-X-ENDLIST`;

    console.log('Storing sub manifest Bucket:', DESTINATION_BUCKET_NAME);
    console.log('Storing sub manifest key:', subManifestKey);
    console.log('Storing sub manifest body:', subManifestBody);

    const putSubManifest = s3
      .putObject({
        Bucket: DESTINATION_BUCKET_NAME,
        Key: subManifestKey,
        Body: subManifestBody,
        ContentType: 'text/plain',
      })
      .promise();
  });

  return `https://${CLOUDFRONT_ENDPOINT}/${mainManifestKey}`;
};
