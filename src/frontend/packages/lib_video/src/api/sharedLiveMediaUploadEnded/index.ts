import {
  API_ENDPOINT,
  SharedLiveMedia,
  Video,
  fetchResponseHandler,
  fetchWrapper,
  modelName,
  useJwt,
} from 'lib-components';

/**
 * Post to an action endpoint to inform the end of the shared live media upload.
 * Returns the updated shared live media
 * @param videoId the video id the shared live media belongs to
 * @param sharedLiveMediaId the shared live media id
 * @param fileKey the file key
 * @returns the updated shared live media
 */
export const sharedLiveMediaUploadEnded = async (
  videoId: Video['id'],
  sharedLiveMediaId: SharedLiveMedia['id'],
  fileKey: string,
): Promise<SharedLiveMedia> => {
  const body = {
    file_key: fileKey,
  };

  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${videoId}/${modelName.SHAREDLIVEMEDIAS}/${sharedLiveMediaId}/upload-ended/`,
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
    errorMessage: `Failed to end the shared live media upload for shared live media ${sharedLiveMediaId}.`,
  });
};
