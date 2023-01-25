import { fetchWrapper, VideoUrls } from 'lib-components';

import { POLL_FOR_LIVE_TIMEOUT } from 'conf/sideEffects';

export const pollForLive = async (
  urls: VideoUrls,
  timeout: number = POLL_FOR_LIVE_TIMEOUT,
): Promise<null> => {
  try {
    const response = await fetchWrapper(urls.manifests.hls);
    if (response.status === 404) {
      throw new Error('missing manifest');
    }
  } catch (error) {
    await new Promise((resolve) => window.setTimeout(resolve, timeout));
    return await pollForLive(urls);
  }

  return null;
};
