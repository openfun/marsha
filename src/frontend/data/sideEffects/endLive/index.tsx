import { API_ENDPOINT } from '../../../settings';
import { Video } from '../../../types/tracks';
import { appData } from '../../appData';

export const endLive = async (video: Video) => {
  const response = await fetch(`${API_ENDPOINT}/videos/${video.id}/end-live/`, {
    headers: {
      Authorization: `Bearer ${appData.jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to end a live streaming for video ${video.id}.`);
  }

  return await response.json();
};
