import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import {
  useJwt,
  documentMockFactory,
  organizationMockFactory,
  playlistMockFactory,
  portabilityRequestMockFactory,
  thumbnailMockFactory,
  timedTextMockFactory,
  videoMockFactory,
  LiveModeType,
} from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import {
  useCreateDocument,
  useCreateVideo,
  useCreatePortabilityRequest,
  useOrganization,
  usePlaylist,
  usePlaylists,
  useThumbnail,
  useTimedTextTracks,
  useUpdatePlaylist,
  useVideo,
  useVideos,
} from '.';

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

describe('queries', () => {
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

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  describe('useOrganization', () => {
    it('requests the resource', async () => {
      const organization = organizationMockFactory();
      fetchMock.mock(`/api/organizations/${organization.id}/`, organization);

      const { result, waitFor } = renderHook(
        () => useOrganization(organization.id),
        { wrapper: Wrapper },
      );
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.calls().length).toEqual(1);
      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/organizations/${organization.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(organization);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource', async () => {
      const organization = organizationMockFactory();
      fetchMock.mock(`/api/organizations/${organization.id}/`, 404);

      const { result, waitFor } = renderHook(
        () => useOrganization(organization.id),
        { wrapper: Wrapper },
      );

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/organizations/${organization.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toBeUndefined();
      expect(result.current.status).toEqual('error');
    });
  });

  describe('usePlaylist', () => {
    it('requests the resource', async () => {
      const playlist = playlistMockFactory();
      fetchMock.mock(`/api/playlists/${playlist.id}/`, playlist);

      const { result, waitFor } = renderHook(() => usePlaylist(playlist.id), {
        wrapper: Wrapper,
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/playlists/${playlist.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(playlist);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource', async () => {
      const playlist = playlistMockFactory();
      fetchMock.mock(`/api/playlists/${playlist.id}/`, 404);

      const { result, waitFor } = renderHook(() => usePlaylist(playlist.id), {
        wrapper: Wrapper,
      });

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/playlists/${playlist.id}/`,
      );
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

  describe('useUpdatePlaylist', () => {
    it('updates the resource', async () => {
      const playlist = playlistMockFactory();
      fetchMock.patch(`/api/playlists/${playlist.id}/`, playlist);

      const { result, waitFor } = renderHook(
        () => useUpdatePlaylist(playlist.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/playlists/${playlist.id}/`,
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
      expect(result.current.data).toEqual(playlist);
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const playlist = playlistMockFactory();
      fetchMock.patch(`/api/playlists/${playlist.id}/`, 400);

      const { result, waitFor } = renderHook(
        () => useUpdatePlaylist(playlist.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/playlists/${playlist.id}/`,
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

  describe('usePlaylists', () => {
    it('requests the resource list', async () => {
      const playlists = Array(4).fill(playlistMockFactory());
      fetchMock.mock('/api/playlists/?limit=999&organization=1', playlists);

      const { result, waitFor } = renderHook(
        () => usePlaylists({ organization: '1' }),
        {
          wrapper: Wrapper,
        },
      );
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/playlists/?limit=999&organization=1',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(playlists);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/playlists/?limit=999&organization=1', 404);

      const { result, waitFor } = renderHook(
        () => usePlaylists({ organization: '1' }),
        { wrapper: Wrapper },
      );

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/playlists/?limit=999&organization=1',
      );
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

  describe('useThumbnail', () => {
    it('requests the resource', async () => {
      const thumbnail = thumbnailMockFactory();
      fetchMock.mock(`/api/thumbnails/${thumbnail.id}/`, thumbnail);

      const { result, waitFor } = renderHook(() => useThumbnail(thumbnail.id), {
        wrapper: Wrapper,
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.calls().length).toEqual(1);
      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/thumbnails/${thumbnail.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(thumbnail);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource', async () => {
      const thumbnail = thumbnailMockFactory();
      fetchMock.mock(`/api/thumbnails/${thumbnail.id}/`, 404);

      const { result, waitFor } = renderHook(() => useThumbnail(thumbnail.id), {
        wrapper: Wrapper,
      });

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/thumbnails/${thumbnail.id}/`,
      );
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

  describe('useTimedTextTracks', () => {
    it('requests the resource list', async () => {
      const timedTextTracks = Array(4).fill(timedTextMockFactory());
      fetchMock.mock(
        '/api/timedtexttracks/?limit=999&video=1',
        timedTextTracks,
      );

      const { result, waitFor } = renderHook(
        () => useTimedTextTracks({ video: '1' }),
        {
          wrapper: Wrapper,
        },
      );
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/timedtexttracks/?limit=999&video=1',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(timedTextTracks);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/timedtexttracks/?limit=999&video=1', 404);

      const { result, waitFor } = renderHook(
        () => useTimedTextTracks({ video: '1' }),
        { wrapper: Wrapper },
      );

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/timedtexttracks/?limit=999&video=1',
      );
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

  describe('useCreateVideo', () => {
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

  describe('useVideo', () => {
    it('requests the resource', async () => {
      const video = videoMockFactory();
      fetchMock.mock(`/api/videos/${video.id}/`, video);

      const { result, waitFor } = renderHook(() => useVideo(video.id), {
        wrapper: Wrapper,
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(video);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource', async () => {
      const video = videoMockFactory();
      fetchMock.mock(`/api/videos/${video.id}/`, 404);

      const { result, waitFor } = renderHook(() => useVideo(video.id), {
        wrapper: Wrapper,
      });

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
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

  describe('useVideos', () => {
    it('requests the resource list', async () => {
      const videos = Array(4).fill(videoMockFactory());
      fetchMock.mock('/api/videos/?limit=999&organization=1', videos);

      const { result, waitFor } = renderHook(
        () => useVideos({ organization: '1' }),
        {
          wrapper: Wrapper,
        },
      );
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/videos/?limit=999&organization=1',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(videos);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/videos/?limit=999&organization=1', 404);

      const { result, waitFor } = renderHook(
        () => useVideos({ organization: '1' }),
        { wrapper: Wrapper },
      );

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/videos/?limit=999&organization=1',
      );
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

  describe('useCreateDocument', () => {
    it('creates the resource', async () => {
      const document = documentMockFactory();
      fetchMock.post('/api/documents/', document);

      const { result, waitFor } = renderHook(() => useCreateDocument(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        playlist: document.playlist.id,
        title: document.title!,
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/documents/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          playlist: document.playlist.id,
          title: document.title,
        }),
      });
      expect(result.current.data).toEqual(document);
      expect(result.current.status).toEqual('success');
    });

    it('fails to create the resource', async () => {
      const document = documentMockFactory();
      fetchMock.post('/api/documents/', 400);

      const { result, waitFor } = renderHook(() => useCreateDocument(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        playlist: document.playlist.id,
        title: document.title!,
      });

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/documents/`);

      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          playlist: document.playlist.id,
          title: document.title,
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useCreatePortabilityRequest', () => {
    it('creates the request', async () => {
      const portabilityRequest = portabilityRequestMockFactory();
      fetchMock.post('/api/portability-requests/', portabilityRequest);

      const { result, waitFor } = renderHook(
        () => useCreatePortabilityRequest(),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        for_playlist: portabilityRequest.for_playlist.id,
        from_playlist: portabilityRequest.from_playlist.id,
        from_lti_consumer_site: portabilityRequest.from_lti_consumer_site!.id,
        from_lti_user_id: portabilityRequest.from_lti_user_id!,
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/portability-requests/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          for_playlist: portabilityRequest.for_playlist.id,
          from_playlist: portabilityRequest.from_playlist.id,
          from_lti_consumer_site: portabilityRequest.from_lti_consumer_site!.id,
          from_lti_user_id: portabilityRequest.from_lti_user_id,
        }),
      });
      expect(result.current.data).toEqual(portabilityRequest);
      expect(result.current.status).toEqual('success');
    });

    it('fails to create the request', async () => {
      const portabilityRequest = portabilityRequestMockFactory();
      fetchMock.post('/api/portability-requests/', 400);

      const { result, waitFor } = renderHook(
        () => useCreatePortabilityRequest(),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        for_playlist: portabilityRequest.for_playlist.id,
        from_playlist: portabilityRequest.from_playlist.id,
        from_lti_consumer_site: portabilityRequest.from_lti_consumer_site!.id,
        from_lti_user_id: portabilityRequest.from_lti_user_id!,
      });

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/portability-requests/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          for_playlist: portabilityRequest.for_playlist.id,
          from_playlist: portabilityRequest.from_playlist.id,
          from_lti_consumer_site: portabilityRequest.from_lti_consumer_site!.id,
          from_lti_user_id: portabilityRequest.from_lti_user_id,
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });
});
