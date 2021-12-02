import { getResource } from 'data/sideEffects/getResource';
import { modelName } from 'types/models';
import { Video } from 'types/tracks';

export const pollForLive = async (video: Video): Promise<null> => {
  try {
    if (!video.urls || !video.urls.manifests.hls) {
      throw new Error('no url defined');
    }
    const response = await fetch(video.urls.manifests.hls);
    if (response.status === 404) {
      throw new Error('missing manifest');
    }
  } catch (error) {
    if (!video.urls || !video.urls.manifests.hls) {
      video = (await getResource(modelName.VIDEOS, video.id)) as Video;
    }
    await new Promise((resolve) =>
      window.setTimeout(
        resolve,
        !video.urls || !video.urls.manifests.hls ? 30000 : 2000,
      ),
    );

    return await pollForLive(video);
  }

  return null;
};
