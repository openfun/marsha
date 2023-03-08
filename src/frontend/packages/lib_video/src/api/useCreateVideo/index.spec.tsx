import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { LiveModeType, useJwt, videoMockFactory } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { useCreateVideo } from '.';

setLogger({
  // tslint:disable-next-line:no-console
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

describe('useCreateVideo', () => {
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

  it('creates the resource', async () => {
    const video = videoMockFactory();
    fetchMock.post('/api/videos/', video);

    const { result, waitFor } = renderHook(() => useCreateVideo(), {
      wrapper: Wrapper,
    });
    result.current.mutate({
      playlist: video.playlist.id,
      title: video.title!,
    });
    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        playlist: video.playlist.id,
        title: video.title,
      }),
    });
    expect(result.current.data).toEqual(video);
    expect(result.current.status).toEqual('success');
  });

  it('creates the resource with description', async () => {
    const video = videoMockFactory();
    fetchMock.post('/api/videos/', video);

    const { result, waitFor } = renderHook(() => useCreateVideo(), {
      wrapper: Wrapper,
    });
    result.current.mutate({
      playlist: video.playlist.id,
      title: video.title!,
      description: video.description!,
    });
    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        playlist: video.playlist.id,
        title: video.title,
        description: video.description,
      }),
    });
    expect(result.current.data).toEqual(video);
    expect(result.current.status).toEqual('success');
  });

  it('creates the resource with live_type and custom success callback', async () => {
    const video = videoMockFactory();
    fetchMock.post('/api/videos/', video);
    const successCallback = jest.fn();

    const { result, waitFor } = renderHook(
      () =>
        useCreateVideo({
          onSuccess: async (createdVideo, variables) => {
            await successCallback(createdVideo, variables);
          },
        }),
      {
        wrapper: Wrapper,
      },
    );
    result.current.mutate({
      playlist: video.playlist.id,
      title: video.title!,
      live_type: LiveModeType.JITSI,
    });
    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        playlist: video.playlist.id,
        title: video.title,
        live_type: LiveModeType.JITSI,
      }),
    });
    expect(result.current.data).toEqual(video);
    expect(result.current.status).toEqual('success');
    expect(successCallback).toHaveBeenCalledWith(video, {
      playlist: video.playlist.id,
      title: video.title!,
      live_type: LiveModeType.JITSI,
    });
  });

  it('fails to create the resource', async () => {
    const video = videoMockFactory();
    fetchMock.post('/api/videos/', 400);

    const { result, waitFor } = renderHook(() => useCreateVideo(), {
      wrapper: Wrapper,
    });
    result.current.mutate({
      playlist: video.playlist.id,
      title: video.title!,
    });

    await waitFor(() => result.current.isError);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        playlist: video.playlist.id,
        title: video.title,
      }),
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});
