import { fetchWrapper, useJwt, API_ENDPOINT, Video } from 'lib-components';

export const publishLiveToVod = async (video: Video) => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${video.id}/live-to-vod/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to publish a live streaming to VOD for video ${video.id}.`,
    );
  }

  return (await response.json()) as Video;
};
