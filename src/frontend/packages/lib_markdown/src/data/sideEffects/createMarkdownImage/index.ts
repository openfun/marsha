/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  useJwt,
  API_ENDPOINT,
  MarkdownImage,
  MarkdownDocumentModelName as modelName,
  fetchWrapper,
} from 'lib-components';

export const createMarkdownImage = async () => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/${modelName.MARKDOWN_IMAGES}/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt()}`,
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
