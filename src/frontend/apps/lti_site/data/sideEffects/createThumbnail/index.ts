import { useJwt } from 'lib-components';

import { API_ENDPOINT } from 'lib-components';
import { modelName } from 'types/models';
import { Thumbnail } from 'lib-components';

/**
 * Create a new thumbnail record for a language-mode combination.
 */
export const createThumbnail = async () => {
  const response = await fetch(`${API_ENDPOINT}/${modelName.THUMBNAILS}/`, {
    headers: {
      Authorization: `Bearer ${useJwt.getState().jwt}`,
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
