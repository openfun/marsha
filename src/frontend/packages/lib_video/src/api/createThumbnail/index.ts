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
export const createThumbnail = async (size: number) => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/${modelName.THUMBNAILS}/`,
    {
      body: JSON.stringify({ size }),
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw await response.json();
  }

  const thumbnail = (await response.json()) as Thumbnail;

  return thumbnail;
};
