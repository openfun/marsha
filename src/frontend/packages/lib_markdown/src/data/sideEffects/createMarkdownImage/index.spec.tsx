import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';

import { createMarkdownImage } from './index';

describe('createMarkdownImage', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
    });
  });

  afterEach(() => fetchMock.restore());

  it('creates a new shared live media and returns it', async () => {
    fetchMock.mock('/api/markdown-images/', {
      active_stamp: null,
      filename: null,
      id: '5570eb90-764e-4300-b92e-d3426e9046d2',
      is_ready_to_show: false,
      upload_state: 'pending',
      url: null,
      markdown_document: '72f53735-3283-456c-a562-4e1b59e2a686',
    });

    const markdownImage = await createMarkdownImage();

    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(markdownImage).toEqual({
      active_stamp: null,
      filename: null,
      id: '5570eb90-764e-4300-b92e-d3426e9046d2',
      is_ready_to_show: false,
      upload_state: 'pending',
      url: null,
      markdown_document: '72f53735-3283-456c-a562-4e1b59e2a686',
    });
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
    });
    expect(fetchArgs.method).toEqual('POST');
  });

  it('throws when it fails to create the Markdown image (request failure)', async () => {
    fetchMock.mock(
      '/api/markdown-images/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(createMarkdownImage()).rejects.toThrow(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to create the Markdown image (API error)', async () => {
    fetchMock.mock('/api/markdown-images/', 400);

    await expect(createMarkdownImage()).rejects.toThrow(
      'Failed to create a new markdown image.',
    );
  });
});
