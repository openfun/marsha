import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { playlistMockFactory } from 'lib-components/tests';
import { WrapperReactQuery } from 'lib-tests';

import { useClaimResource } from './useClaimResource';

describe('useClaimResource', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    useJwt.getState().resetJwt();
  });

  it('succeeds to claim resource', async () => {
    const playlist = playlistMockFactory();
    fetchMock.postOnce(`/api/playlists/${playlist.id}/claim/`, playlist);

    const { result } = renderHook(() => useClaimResource(playlist.id), {
      wrapper: WrapperReactQuery,
    });
    result.current.mutate();
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/playlists/${playlist.id}/claim/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'POST',
    });
  });

  it('fails to claim resource', async () => {
    const playlist = playlistMockFactory();
    fetchMock.postOnce(`/api/playlists/${playlist.id}/claim/`, {
      status: 400,
      body: { error: 'some error' },
    });

    const { result } = renderHook(() => useClaimResource(playlist.id), {
      wrapper: WrapperReactQuery,
    });
    result.current.mutate();
    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/playlists/${playlist.id}/claim/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'POST',
    });
  });
});
