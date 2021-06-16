import { VideoUrls } from '../../../types/tracks';

export const pollForLive = async (
  urls: VideoUrls,
  timeout: number = 2000,
): Promise<null> => {
  try {
    const response = await fetch(urls.manifests.hls);
    if (response.status === 404) {
      throw new Error('missing manifest');
    }
  } catch (error) {
    await new Promise((resolve) => window.setTimeout(resolve, timeout));
    return await pollForLive(urls);
  }

  return null;
};
