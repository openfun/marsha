import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';

import { createSharedLiveMedia } from '.';

describe('sideEffects/createSharedLiveMedia', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
    });
  });

  afterEach(() => fetchMock.restore());

  it('creates a new shared live media and returns it', async () => {
    fetchMock.mock('/api/sharedlivemedias/', {
      id: 'shared_live_media_id',
      is_ready_to_show: false,
      show_download: true,
      upload_state: 'pending',
      video: 'video_id',
    });

    const sharedLiveMedia = await createSharedLiveMedia({
      video: 'video_id',
    });

    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(sharedLiveMedia).toEqual({
      id: 'shared_live_media_id',
      is_ready_to_show: false,
      show_download: true,
      upload_state: 'pending',
      video: 'video_id',
    });
    expect(fetchArgs.body).toEqual(JSON.stringify({ video: 'video_id' }));
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
    });
    expect(fetchArgs.method).toEqual('POST');
  });

  it('throws when it fails to create the shared live media (request failure)', async () => {
    fetchMock.mock(
      '/api/sharedlivemedias/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      createSharedLiveMedia({
        video: 'video_id',
      }),
    ).rejects.toThrow('Failed to perform the request');
  });

  it('throws when it fails to create the shared live media (API error)', async () => {
    fetchMock.mock('/api/sharedlivemedias/', 400);

    await expect(
      createSharedLiveMedia({
        video: 'video_id',
      }),
    ).rejects.toThrow('Failed to create a new shared live media.');
  });
});
