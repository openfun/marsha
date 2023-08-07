import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { v4 as uuidv4 } from 'uuid';

import { createMarkdownImage } from './index';

describe('createMarkdownImage', () => {
  const markdownDocumentId = uuidv4();
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
    });
  });

  afterEach(() => fetchMock.restore());

  it('creates a new shared live media and returns it', async () => {
    fetchMock.mock(
      `/api/markdown-documents/${markdownDocumentId}/markdown-images/`,
      {
        active_stamp: null,
        filename: null,
        id: '5570eb90-764e-4300-b92e-d3426e9046d2',
        is_ready_to_show: false,
        upload_state: 'pending',
        url: null,
        markdown_document: markdownDocumentId,
      },
    );

    const markdownImage = await createMarkdownImage(markdownDocumentId);

    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(markdownImage).toEqual({
      active_stamp: null,
      filename: null,
      id: '5570eb90-764e-4300-b92e-d3426e9046d2',
      is_ready_to_show: false,
      upload_state: 'pending',
      url: null,
      markdown_document: markdownDocumentId,
    });
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
    });
    expect(fetchArgs.method).toEqual('POST');
  });

  it('throws when it fails to create the Markdown image (request failure)', async () => {
    fetchMock.mock(
      `/api/markdown-documents/${markdownDocumentId}/markdown-images/`,
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(createMarkdownImage(markdownDocumentId)).rejects.toThrow(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to create the Markdown image (API error)', async () => {
    fetchMock.mock(
      `/api/markdown-documents/${markdownDocumentId}/markdown-images/`,
      400,
    );

    await expect(createMarkdownImage(markdownDocumentId)).rejects.toThrow(
      'Failed to create a new markdown image.',
    );
  });
});
