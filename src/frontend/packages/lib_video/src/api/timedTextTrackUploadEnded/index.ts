import {
  API_ENDPOINT,
  TimedText,
  Video,
  fetchResponseHandler,
  fetchWrapper,
  modelName,
  useJwt,
} from 'lib-components';

/**
 * Post to an action endpoint to inform the end of the timed text track upload.
 * Returns the updated timed text track
 * @param videoId the video id the timed text track belongs to
 * @param timedTextTrackId the timed text track id
 * @param fileKey the file key
 * @returns the updated timed text track
 */
export const timedTextTrackUploadEnded = async (
  videoId: Video['id'],
  timedTextTrackId: TimedText['id'],
  fileKey: string,
): Promise<TimedText> => {
  const body = {
    file_key: fileKey,
  };

  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${videoId}/${modelName.TIMEDTEXTTRACKS}/${timedTextTrackId}/upload-ended/`,
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
    errorMessage: `Failed to end the timed text track upload for timed text track ${timedTextTrackId}.`,
  });
};
