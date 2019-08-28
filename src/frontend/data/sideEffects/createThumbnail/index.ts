import { API_ENDPOINT } from '../../../settings';
import { modelName } from '../../../types/models';
import { Thumbnail } from '../../../types/tracks';
import { appData } from '../../appData';

/**
 * Create a new thumbnail record for a language-mode combination.
 */
export const createThumbnail = async () => {
  const response = await fetch(`${API_ENDPOINT}/${modelName.THUMBNAILS}/`, {
    headers: {
      Authorization: `Bearer ${appData.jwt}`,
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
