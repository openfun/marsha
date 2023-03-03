import {
  fetchWrapper,
  useJwt,
  API_ENDPOINT,
  modelName,
  Thumbnail,
  fetchResponseHandler,
} from 'lib-components';

interface createThumbnailBody {
  size: number;
  video: string;
}

/**
 * Create a new thumbnail record for a language-mode combination.
 */
export const createThumbnail = async (
  body: createThumbnailBody,
): Promise<Thumbnail> => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/${modelName.THUMBNAILS}/`,
    {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  return await fetchResponseHandler(response);
};
