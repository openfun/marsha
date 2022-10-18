import { useJwt } from 'lib-components';
import { API_ENDPOINT } from 'settings';

import {
  MarkdownImage,
  MarkdownDocumentModelName as modelName,
} from 'lib-components';

export const createMarkdownImage = async () => {
  const response = await fetch(
    `${API_ENDPOINT}/${modelName.MARKDOWN_IMAGES}/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to create a new markdown image.');
  }

  const markdownImage: MarkdownImage = await response.json();

  return markdownImage;
};
