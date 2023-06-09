import { API_ENDPOINT, Video, fetchWrapper, useJwt } from 'lib-components';

/**
 * Post to an action endpoint to start a live streaming.
 * Returns the updated video
 * @param video initiate a live mode on this video
 */
export const startLive = async (videoId: Video['id']): Promise<Video> => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${videoId}/start-live/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to start a live streaming for video ${videoId}.`);
  }

  return (await response.json()) as Video;
};
