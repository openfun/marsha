// module responsible to fetch an HLS manifest and detect when tag
// EXT-X-ENDLIST has been removed in it.
import { Parser } from 'm3u8-parser';

import { getResource } from 'data/sideEffects/getResource';
import { modelName } from 'types/models';
import { Video } from 'types/tracks';

const regex = /^(https.*)\/.*\.m3u8$/;

export const resumeLive = async (video: Video) => {
  const manifestUrl = video.urls?.manifests.hls!;

  const mainManifest = await fetchManifest(manifestUrl);
  const firstManifest = mainManifest.playlists[0].uri;
  const matches = manifestUrl.match(regex);

  await pollEndedManifest(`${matches![1]}/${firstManifest}`);
  await getResource(modelName.VIDEOS, video.id);
};

const pollEndedManifest = async (manifestUrl: string) => {
  const manifest = await fetchManifest(manifestUrl);

  if (manifest.endList) {
    await new Promise((resolve) => window.setTimeout(resolve, 2500));
    await pollEndedManifest(manifestUrl);
  }
};

const fetchManifest = async (manifestUrl: string) => {
  const manifest = await fetch(manifestUrl).then((response) => response.text());
  const hlsParser = new Parser();
  hlsParser.push(manifest);
  hlsParser.end();

  return hlsParser.manifest;
};
