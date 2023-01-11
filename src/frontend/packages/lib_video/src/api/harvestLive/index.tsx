import { useJwt, Video, API_ENDPOINT } from 'lib-components';

export const harvestLive = async (video: Video) => {
  const response = await fetch(
    `${API_ENDPOINT}/videos/${video.id}/harvest-live/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt ?? ''}`,
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
