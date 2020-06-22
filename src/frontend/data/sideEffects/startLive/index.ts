import { API_ENDPOINT } from '../../../settings';
import { Video } from '../../../types/tracks';
import { appData } from '../../appData';

/**
 * Post to an action endpoint to start a live streaming.
 * Returns the updated video
 * @param video initiate a live mode on this video
 */
export const startLive = async (video: Video): Promise<Video> => {
  const response = await fetch(
    `${API_ENDPOINT}/videos/${video.id}/start-live/`,
    {
      headers: {
        Authorization: `Bearer ${appData.jwt}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to start a live streaming for video ${video.id}.`);
  }

  return await response.json();
};
