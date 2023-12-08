import {
  API_ENDPOINT,
  Video,
  fetchResponseHandler,
  fetchWrapper,
  useJwt,
} from 'lib-components';

/**
 * Post to an action endpoint to inform the end of the video upload.
 * Returns the updated video
 * @param video this video's file has been uploaded
 */
export const uploadEnded = async (
  videoId: Video['id'],
  fileKey: string,
): Promise<Video> => {
  const body = {
    file_key: fileKey,
  };

  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${videoId}/upload-ended/`,
    {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  return await fetchResponseHandler(response, {
    errorMessage: `Failed to end the video upload for video ${videoId}.`,
  });
};
