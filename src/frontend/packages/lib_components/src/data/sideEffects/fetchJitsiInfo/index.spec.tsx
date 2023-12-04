import fetchMock from 'fetch-mock';

import { useJwt } from '@lib-components/hooks/stores/useJwt';
import { videoMockFactory } from '@lib-components/tests';

import { fetchJitsiInfo } from '.';

describe('fetchJitsiInfo', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('fetch the jitsi info endpoint and return them', async () => {
    const video = videoMockFactory();

    fetchMock.mock(
      `/api/videos/${video.id}/jitsi/`,
      JSON.stringify({
        config_overwrite: {},
        domain: 'meet.jit.si',
        external_api_url: 'https://meet.jit.si/external_api.js',
        interface_config_overwrite: {},
        room_name: `${video.id}`,
      }),
    );

    const jistiInfo = await fetchJitsiInfo(video);

    expect(jistiInfo).toEqual({
      config_overwrite: {},
      domain: 'meet.jit.si',
      external_api_url: 'https://meet.jit.si/external_api.js',
      interface_config_overwrite: {},
      room_name: `${video.id}`,
    });
  });

  it('fails to fetch jitsi info endpoint (request failure)', async () => {
    const video = videoMockFactory();
    fetchMock.mock(
      `/api/videos/${video.id}/jitsi/`,
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(fetchJitsiInfo(video)).rejects.toThrow(
      'Failed to perform the request',
    );
  });

  it('fails to fetch jitsi info endpoint (api)', async () => {
    const video = videoMockFactory();
    fetchMock.mock(`/api/videos/${video.id}/jitsi/`, {
      status: 400,
      body: JSON.stringify({ error: 'this is not a live' }),
    });

    await expect(fetchJitsiInfo(video)).rejects.toThrow(
      `Failed to fetch jitsi info for video ${video.id} with error message {"error":"this is not a live"}`,
    );
  });
});
