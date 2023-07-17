import { API_ENDPOINT, Video, fetchWrapper, useJwt } from 'lib-components';

export const harvestLive = async (video: Video) => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${video.id}/harvest-live/`,
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
      `Failed to harvest a live streaming for video ${video.id}.`,
    );
  }

  return (await response.json()) as Video;
};
