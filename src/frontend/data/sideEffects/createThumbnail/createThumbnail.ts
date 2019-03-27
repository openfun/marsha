import { API_ENDPOINT } from '../../../settings';
import { modelName } from '../../../types/models';
import { Thumbnail } from '../../../types/tracks';

/**
 * Create a new thumbnail record for a language-mode combination.
 * @param jwt The token that will be used to authenticate with the API.
 */
export const createThumbnail = async (jwt: string) => {
  const response = await fetch(`${API_ENDPOINT}/${modelName.THUMBNAIL}/`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to create a new thumbnail.');
  }

  const thumbnail: Thumbnail = await response.json();

  return thumbnail;
};
