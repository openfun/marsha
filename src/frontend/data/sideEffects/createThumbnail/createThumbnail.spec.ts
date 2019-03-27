import fetchMock from 'fetch-mock';

import { createThumbnail } from './createThumbnail';

describe('sideEffects/createThumbnail', () => {
  afterEach(fetchMock.restore);

  it('creates a new thumbnail and return it', async () => {
    fetchMock.mock('/api/thumbnail/', {
      id: '42',
      ready_to_display: false,
      urls: null,
    });

    const thumbnail = await createThumbnail('token');

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
      '/api/thumbnail/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(createThumbnail('token')).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to create the thumbnail (API error)', async () => {
    fetchMock.mock('/api/thumbnail/', 400);

    await expect(createThumbnail('token')).rejects.toThrowError(
      'Failed to create a new thumbnail.',
    );
  });
});
