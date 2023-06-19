import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { thumbnailMockFactory, useJwt } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';
import { setLogger } from 'react-query';

import { useDeleteThumbnail } from '.';

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

describe('useDeleteThumbnail', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('deletes the resource', async () => {
    const thumbnail = thumbnailMockFactory();
    fetchMock.delete(
      `/api/videos/${thumbnail.video}/thumbnails/${thumbnail.id}/`,
      204,
    );

    const { result } = renderHook(() => useDeleteThumbnail(), {
      wrapper: WrapperReactQuery,
    });
    result.current.mutate({
      videoId: thumbnail.video,
      thumbnailId: thumbnail.id,
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${thumbnail.video}/thumbnails/${thumbnail.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('success');
  });

  it('fails to delete the resource', async () => {
    const thumbnail = thumbnailMockFactory();
    fetchMock.delete(
      `/api/videos/${thumbnail.video}/thumbnails/${thumbnail.id}/`,
      400,
    );

    const { result } = renderHook(() => useDeleteThumbnail(), {
      wrapper: WrapperReactQuery,
    });
    result.current.mutate({
      videoId: thumbnail.video,
      thumbnailId: thumbnail.id,
    });
    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${thumbnail.video}/thumbnails/${thumbnail.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});
