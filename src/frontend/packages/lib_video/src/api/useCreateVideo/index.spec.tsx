import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { LiveModeType, useJwt, videoMockFactory } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';

import { useCreateVideo } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('useCreateVideo', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('creates the resource', async () => {
    const video = videoMockFactory();
    fetchMock.post('/api/videos/', video);

    const { result } = renderHook(() => useCreateVideo(), {
      wrapper: WrapperReactQuery,
    });
    result.current.mutate({
      playlist: video.playlist.id,
      title: video.title!,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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

    const { result } = renderHook(() => useCreateVideo(), {
      wrapper: WrapperReactQuery,
    });
    result.current.mutate({
      playlist: video.playlist.id,
      title: video.title!,
      description: video.description!,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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

    const { result } = renderHook(
      () =>
        useCreateVideo({
          onSuccess: async (createdVideo, variables) => {
            await successCallback(createdVideo, variables);
          },
        }),
      {
        wrapper: WrapperReactQuery,
      },
    );
    result.current.mutate({
      playlist: video.playlist.id,
      title: video.title!,
      live_type: LiveModeType.JITSI,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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

    const { result } = renderHook(() => useCreateVideo(), {
      wrapper: WrapperReactQuery,
    });
    result.current.mutate({
      playlist: video.playlist.id,
      title: video.title!,
    });

    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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
