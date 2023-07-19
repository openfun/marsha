import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { sharedLiveMediaMockFactory, useJwt } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';
import { setLogger } from '@tanstack/react-query';

import { useUpdateSharedLiveMedia } from '.';

setLogger({
  log: console.log,
  warn: console.warn,
  // no more errors on the console
  error: () => {},
});

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('useUpdateSharedLiveMedia', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('updates the resource', async () => {
    const sharedLiveMedia = sharedLiveMediaMockFactory();
    fetchMock.patch(
      `/api/videos/${sharedLiveMedia.video}/sharedlivemedias/${sharedLiveMedia.id}/`,
      sharedLiveMedia,
    );

    const { result } = renderHook(
      () => useUpdateSharedLiveMedia(sharedLiveMedia.video, sharedLiveMedia.id),
      {
        wrapper: WrapperReactQuery,
      },
    );
    result.current.mutate({
      title: 'updated title',
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${sharedLiveMedia.video}/sharedlivemedias/${sharedLiveMedia.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'updated title',
      }),
    });
    expect(result.current.data).toEqual(sharedLiveMedia);
    expect(result.current.status).toEqual('success');
  });

  it('fails to update the resource', async () => {
    const sharedLiveMedia = sharedLiveMediaMockFactory();
    fetchMock.patch(
      `/api/videos/${sharedLiveMedia.video}/sharedlivemedias/${sharedLiveMedia.id}/`,
      400,
    );

    const { result } = renderHook(
      () => useUpdateSharedLiveMedia(sharedLiveMedia.video, sharedLiveMedia.id),
      {
        wrapper: WrapperReactQuery,
      },
    );
    result.current.mutate({
      title: 'updated title',
    });
    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${sharedLiveMedia.video}/sharedlivemedias/${sharedLiveMedia.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'updated title',
      }),
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});
