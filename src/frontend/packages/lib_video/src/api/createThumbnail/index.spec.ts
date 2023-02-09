import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';

import { createThumbnail } from '.';

describe('sideEffects/createThumbnail', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
    });
  });

  afterEach(() => fetchMock.restore());

  it('creates a new thumbnail and return it', async () => {
    fetchMock.mock('/api/thumbnails/', {
      id: '42',
      ready_to_display: false,
      urls: null,
    });

    const thumbnail = await createThumbnail(10);
    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(thumbnail).toEqual({
      id: '42',
      ready_to_display: false,
      urls: null,
    });
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
    });
    expect(fetchArgs.method).toEqual('POST');
  });

  it('throws when it fails to create the thumbnail (request failure)', async () => {
    fetchMock.mock(
      '/api/thumbnails/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(createThumbnail(10)).rejects.toThrow(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to create the thumbnail (API error)', async () => {
    fetchMock.mock('/api/thumbnails/', 400);

    await expect(createThumbnail(10)).rejects.toThrow();
  });
});
