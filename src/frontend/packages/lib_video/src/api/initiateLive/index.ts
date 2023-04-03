import {
  fetchWrapper,
  useJwt,
  API_ENDPOINT,
  LiveModeType,
  Video,
  fetchResponseHandler,
} from 'lib-components';

/**
 * Post to an action endpoint that declares the beginning of live video.
 * Returns the updated video
 * @param video initiate a live mode on this video
 */
export const initiateLive = async (
  video: Video,
  type: LiveModeType,
): Promise<Video> => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${video.id}/initiate-live/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        type,
      }),
    },
  );

  return await fetchResponseHandler(response, {
    errorMessage: `Failed to initialize a live mode for video ${video.id}.`,
  });
};
