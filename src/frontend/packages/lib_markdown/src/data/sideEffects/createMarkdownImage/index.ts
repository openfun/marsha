/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  API_ENDPOINT,
  MarkdownDocument,
  MarkdownImage,
  fetchWrapper,
  MarkdownDocumentModelName as modelName,
  useJwt,
} from 'lib-components';

export const createMarkdownImage = async (
  markdownDocumentId: MarkdownDocument['id'],
) => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/${modelName.MARKDOWN_DOCUMENTS}/${markdownDocumentId}/${modelName.MARKDOWN_IMAGES}/`,
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
