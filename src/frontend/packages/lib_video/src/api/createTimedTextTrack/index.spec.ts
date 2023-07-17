import fetchMock from 'fetch-mock';
import { timedTextMode, useJwt } from 'lib-components';

import { createTimedTextTrack } from '.';

describe('sideEffects/createTimedTextTrack()', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());

  it('creates a new timedtexttrack and returns its id', async () => {
    fetchMock.mock('/api/videos/1234/timedtexttracks/', {
      id: '42',
      language: 'en',
      mode: 'st',
    });

    const track = await createTimedTextTrack({
      language: 'en',
      mode: timedTextMode.SUBTITLE,
      size: 10,
      video: '1234',
    });
    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(track).toEqual({ id: '42', language: 'en', mode: 'st' });
    expect(fetchArgs.body).toEqual(
      JSON.stringify({ language: 'en', mode: 'st', size: 10 }),
    );
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer some token',
      'Content-Type': 'application/json',
    });
    expect(fetchArgs.method).toEqual('POST');
  });

  it('throws when it fails to create the timedtexttrack (request failure)', async () => {
    fetchMock.mock(
      '/api/videos/1234/timedtexttracks/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      createTimedTextTrack({
        language: 'en',
        mode: timedTextMode.SUBTITLE,
        size: 10,
        video: '1234',
      }),
    ).rejects.toThrow('Failed to perform the request');
  });

  it('throws when it fails to create the timedtexttrack (API error)', async () => {
    fetchMock.mock('/api/videos/1234/timedtexttracks/', 400);

    await expect(
      createTimedTextTrack({
        language: 'en',
        mode: timedTextMode.SUBTITLE,
        size: 10,
        video: '1234',
      }),
    ).rejects.toThrow();
  });
});
