import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt, videoMockFactory } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';

import { usePairingVideo } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('usePairingingVideo', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('updates the resource', async () => {
    const video = videoMockFactory();
    fetchMock.get(`/api/videos/${video.id}/pairing-secret/`, {
      secret: '12345',
    });

    const { result } = renderHook(() => usePairingVideo(video.id), {
      wrapper: WrapperReactQuery,
    });
    result.current.mutate();
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/pairing-secret/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'GET',
    });
    expect(result.current.data).toEqual({ secret: '12345' });
    expect(result.current.status).toEqual('success');
  });

  it('fails to update the resource', async () => {
    const video = videoMockFactory();
    fetchMock.get(`/api/videos/${video.id}/pairing-secret/`, 400);

    const { result } = renderHook(() => usePairingVideo(video.id), {
      wrapper: WrapperReactQuery,
    });
    result.current.mutate();
    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/pairing-secret/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'GET',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});
