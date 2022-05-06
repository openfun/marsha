import { appData } from 'data/appData';
import { Video } from 'types/tracks';
import { API_ENDPOINT } from 'settings';

export const harvestLive = async (video: Video) => {
  const response = await fetch(
    `${API_ENDPOINT}/videos/${video.id}/harvest-live/`,
    {
      headers: {
        Authorization: `Bearer ${appData.jwt}`,
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

  return await response.json();
};
