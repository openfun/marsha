import {
  fetchWrapper,
  useJwt,
  API_ENDPOINT,
  modelName,
  Thumbnail,
} from 'lib-components';

/**
 * Create a new thumbnail record for a language-mode combination.
 */
export const createThumbnail = async () => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/${modelName.THUMBNAILS}/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to create a new thumbnail.');
  }

  const thumbnail = (await response.json()) as Thumbnail;

  return thumbnail;
};
