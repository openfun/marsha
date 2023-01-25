import { fetchWrapper, useJwt, API_ENDPOINT, Video } from 'lib-components';

/**
 * Post to an action endpoint to stop a live streaming.
 * Returns the updated video
 * @param video initiate a live mode on this video
 */
export const stopLive = async (video: Video): Promise<Video> => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${video.id}/stop-live/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to stop a live streaming for video ${video.id}.`);
  }

  return (await response.json()) as Video;
};
