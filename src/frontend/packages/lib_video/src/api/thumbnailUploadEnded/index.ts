import {
  API_ENDPOINT,
  Thumbnail,
  Video,
  fetchResponseHandler,
  fetchWrapper,
  modelName,
  useJwt,
} from 'lib-components';

/**
 * Post to an action endpoint to inform the end of the thumbnail upload.
 * Returns the updated thumbnail
 * @param videoId the video id the thumbnail belongs to
 * @param thumbnailId the thumbnail id
 * @param fileKey the file key
 * @returns the updated thumbnail
 */
export const thumbnailUploadEnded = async (
  videoId: Video['id'],
  thumbnailId: Thumbnail['id'],
  fileKey: string,
): Promise<Thumbnail> => {
  const body = {
    file_key: fileKey,
  };

  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${videoId}/${modelName.THUMBNAILS}/${thumbnailId}/upload-ended/`,
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
    errorMessage: `Failed to end the thumbnail upload for thumbnail ${thumbnailId}.`,
  });
};
