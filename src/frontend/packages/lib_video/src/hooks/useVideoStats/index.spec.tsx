import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { useJwt, videoMockFactory } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { useStatsVideo } from '.';

let Wrapper: WrapperComponent<Element>;

describe('useStatsVideo', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });

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

  it('updates the resource', async () => {
    const video = videoMockFactory();
    fetchMock.get(`/api/videos/${video.id}/stats/`, {
      nb_views: 123,
    });

    const { result, waitFor } = renderHook(() => useStatsVideo(video.id), {
      wrapper: Wrapper,
    });
    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/stats/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
    expect(result.current.data).toEqual({ nb_views: 123 });
    expect(result.current.status).toEqual('success');
  });

  it('fails to update the resource', async () => {
    const video = videoMockFactory();
    fetchMock.get(`/api/videos/${video.id}/stats/`, 400);

    const { result, waitFor } = renderHook(() => useStatsVideo(video.id), {
      wrapper: Wrapper,
    });
    await waitFor(() => result.current.isError);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/stats/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});
