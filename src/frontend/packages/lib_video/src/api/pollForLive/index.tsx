import { VideoUrls } from 'lib-components';

import { POLL_FOR_LIVE_TIMEOUT } from 'conf/sideEffects';
import { resumeLive } from 'utils/resumeLive';

export const pollForLive = async (
  urls: VideoUrls,
  timeout: number = POLL_FOR_LIVE_TIMEOUT,
): Promise<null> => {
  try {
    await resumeLive(urls.manifests.hls);
  } catch (error) {
    await new Promise((resolve) => window.setTimeout(resolve, timeout));
    return await pollForLive(urls);
  }

  return null;
};
