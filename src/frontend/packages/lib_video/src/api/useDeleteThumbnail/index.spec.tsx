import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { thumbnailMockFactory, useJwt } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

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

let Wrapper: WrapperComponent<Element>;

describe('useDeleteThumbnail', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    Wrapper = ({ children }: Element) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
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

    const { result, waitFor } = renderHook(() => useDeleteThumbnail(), {
      wrapper: Wrapper,
    });
    result.current.mutate({
      videoId: thumbnail.video,
      thumbnailId: thumbnail.id,
    });
    await waitFor(() => result.current.isSuccess);

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

    const { result, waitFor } = renderHook(() => useDeleteThumbnail(), {
      wrapper: Wrapper,
    });
    result.current.mutate({
      videoId: thumbnail.video,
      thumbnailId: thumbnail.id,
    });
    await waitFor(() => result.current.isError);

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
