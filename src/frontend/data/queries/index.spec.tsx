import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import {
  documentMockFactory,
  organizationMockFactory,
  playlistMockFactory,
  sharedLiveMediaMockFactory,
  thumbnailMockFactory,
  timedTextMockFactory,
  videoMockFactory,
} from 'utils/tests/factories';
import {
  useCreateDocument,
  useCreateVideo,
  useDeleteSharedLiveMedia,
  useOrganization,
  usePairingVideo,
  usePlaylist,
  usePlaylists,
  useStartLiveRecording,
  useStartSharingMedia,
  useStopLiveRecording,
  useStopSharingMedia,
  useThumbnail,
  useTimedTextTracks,
  useUpdatePlaylist,
  useUpdateSharedLiveMedia,
  useUpdateVideo,
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

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

let Wrapper: WrapperComponent<Element>;

describe('queries', () => {
  beforeEach(() => {
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
      fetchMock.mock('/api/playlists/?organization=1&limit=999', playlists);

      const { result, waitFor } = renderHook(
        () => usePlaylists({ organization: '1' }),
        {
          wrapper: Wrapper,
        },
      );
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/playlists/?organization=1&limit=999',
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
      fetchMock.mock('/api/playlists/?organization=1&limit=999', 404);

      const { result, waitFor } = renderHook(
        () => usePlaylists({ organization: '1' }),
        { wrapper: Wrapper },
      );

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/playlists/?organization=1&limit=999',
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
        '/api/timedtexttracks/?video=1&limit=999',
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
        '/api/timedtexttracks/?video=1&limit=999',
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
      fetchMock.mock('/api/timedtexttracks/?video=1&limit=999', 404);

      const { result, waitFor } = renderHook(
        () => useTimedTextTracks({ video: '1' }),
        { wrapper: Wrapper },
      );

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/timedtexttracks/?video=1&limit=999',
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

  describe('useUpdateVideo', () => {
    it('updates the resource', async () => {
      const video = videoMockFactory();
      fetchMock.patch(`/api/videos/${video.id}/`, video);

      const { result, waitFor } = renderHook(() => useUpdateVideo(video.id), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
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
      expect(result.current.data).toEqual(video);
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const video = videoMockFactory();
      fetchMock.patch(`/api/videos/${video.id}/`, 400);

      const { result, waitFor } = renderHook(() => useUpdateVideo(video.id), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
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
      fetchMock.mock('/api/videos/?organization=1&limit=999', videos);

      const { result, waitFor } = renderHook(
        () => useVideos({ organization: '1' }),
        {
          wrapper: Wrapper,
        },
      );
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/videos/?organization=1&limit=999',
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
      fetchMock.mock('/api/videos/?organization=1&limit=999', 404);

      const { result, waitFor } = renderHook(
        () => useVideos({ organization: '1' }),
        { wrapper: Wrapper },
      );

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/videos/?organization=1&limit=999',
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

  describe('usePairingingVideo', () => {
    it('updates the resource', async () => {
      const video = videoMockFactory();
      fetchMock.get(`/api/videos/${video.id}/pairing-secret/`, {
        secret: '12345',
      });

      const { result, waitFor } = renderHook(() => usePairingVideo(video.id), {
        wrapper: Wrapper,
      });
      result.current.mutate();
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${video.id}/pairing-secret/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });
      expect(result.current.data).toEqual({ secret: '12345' });
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const video = videoMockFactory();
      fetchMock.get(`/api/videos/${video.id}/pairing-secret/`, 400);

      const { result, waitFor } = renderHook(() => usePairingVideo(video.id), {
        wrapper: Wrapper,
      });
      result.current.mutate();
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${video.id}/pairing-secret/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useStartLiveRecording', () => {
    it('updates the resource', async () => {
      const video = videoMockFactory();
      fetchMock.patch(`/api/videos/${video.id}/start-recording/`, video);

      const onError = jest.fn();
      const { result, waitFor } = renderHook(
        () => useStartLiveRecording(video.id, onError),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate();
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${video.id}/start-recording/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      });
      expect(result.current.data).toEqual(video);
      expect(result.current.status).toEqual('success');

      expect(onError).not.toHaveBeenCalled();
    });

    it('fails to update the resource', async () => {
      const video = videoMockFactory();
      fetchMock.patch(`/api/videos/${video.id}/start-recording/`, 400);

      const onError = jest.fn();
      const { result, waitFor } = renderHook(
        () => useStartLiveRecording(video.id, onError),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate();
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${video.id}/start-recording/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('useStopLiveRecording', () => {
    it('updates the resource', async () => {
      const video = videoMockFactory();
      fetchMock.patch(`/api/videos/${video.id}/stop-recording/`, video);

      const onError = jest.fn();
      const { result, waitFor } = renderHook(
        () => useStopLiveRecording(video.id, onError),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate();
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${video.id}/stop-recording/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      });
      expect(result.current.data).toEqual(video);
      expect(result.current.status).toEqual('success');

      expect(onError).not.toHaveBeenCalled();
    });

    it('fails to update the resource', async () => {
      const video = videoMockFactory();
      fetchMock.patch(`/api/videos/${video.id}/stop-recording/`, 400);

      const onError = jest.fn();
      const { result, waitFor } = renderHook(
        () => useStopLiveRecording(video.id, onError),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate();
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${video.id}/stop-recording/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');

      expect(onError).toHaveBeenCalled();
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

  describe('useUpdateSharedLiveMedia', () => {
    it('updates the resource', async () => {
      const sharedLiveMedia = sharedLiveMediaMockFactory();
      fetchMock.patch(
        `/api/sharedlivemedias/${sharedLiveMedia.id}/`,
        sharedLiveMedia,
      );

      const { result, waitFor } = renderHook(
        () => useUpdateSharedLiveMedia(sharedLiveMedia.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/sharedlivemedias/${sharedLiveMedia.id}/`,
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
      fetchMock.patch(`/api/sharedlivemedias/${sharedLiveMedia.id}/`, 400);

      const { result, waitFor } = renderHook(
        () => useUpdateSharedLiveMedia(sharedLiveMedia.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/sharedlivemedias/${sharedLiveMedia.id}/`,
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

  describe('useDeleteSharedLiveMedia', () => {
    it('deletes the resource', async () => {
      const sharedLiveMedia = sharedLiveMediaMockFactory();
      fetchMock.delete(`/api/sharedlivemedias/${sharedLiveMedia.id}/`, 204);

      const { result, waitFor } = renderHook(() => useDeleteSharedLiveMedia(), {
        wrapper: Wrapper,
      });
      result.current.mutate(sharedLiveMedia.id);
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/sharedlivemedias/${sharedLiveMedia.id}/`,
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
      const sharedLiveMedia = sharedLiveMediaMockFactory();
      fetchMock.delete(`/api/sharedlivemedias/${sharedLiveMedia.id}/`, 400);

      const { result, waitFor } = renderHook(() => useDeleteSharedLiveMedia(), {
        wrapper: Wrapper,
      });
      result.current.mutate(sharedLiveMedia.id);
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/sharedlivemedias/${sharedLiveMedia.id}/`,
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

  describe('useStartSharingMedia', () => {
    it('updates the resource', async () => {
      const videoId = 'id_video';
      const sharedLiveMedia = sharedLiveMediaMockFactory({ video: videoId });
      const video = videoMockFactory({
        id: videoId,
        active_shared_live_media: sharedLiveMedia,
        active_shared_live_media_page: 1,
        shared_live_medias: [sharedLiveMedia],
      });
      fetchMock.patch(`/api/videos/${video.id}/start-sharing/`, {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
        body: JSON.stringify(video),
      });

      const onSuccess = jest.fn();
      const onError = jest.fn();
      const { result, waitFor } = renderHook(
        () => useStartSharingMedia(video.id, { onSuccess, onError }),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({ sharedlivemedia: sharedLiveMedia.id });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${video.id}/start-sharing/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({ sharedlivemedia: sharedLiveMedia.id }),
      });
      expect(result.current.data).toEqual(video);
      expect(result.current.status).toEqual('success');

      expect(onSuccess).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('fails to update the resource', async () => {
      const videoId = 'id_video';
      const sharedLiveMedia = sharedLiveMediaMockFactory({ video: videoId });
      const video = videoMockFactory({
        id: videoId,
        active_shared_live_media: null,
        active_shared_live_media_page: null,
        shared_live_medias: [sharedLiveMedia],
      });
      fetchMock.patch(`/api/videos/${video.id}/start-sharing/`, 400);

      const onSuccess = jest.fn();
      const onError = jest.fn();
      const { result, waitFor } = renderHook(
        () => useStartSharingMedia(video.id, { onSuccess, onError }),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({ sharedlivemedia: sharedLiveMedia.id });
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${video.id}/start-sharing/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({ sharedlivemedia: sharedLiveMedia.id }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('useStopSharingMedia', () => {
    it('updates the resource', async () => {
      const videoId = 'id_video';
      const sharedLiveMedia = sharedLiveMediaMockFactory({ video: videoId });
      const video = videoMockFactory({
        id: videoId,
        active_shared_live_media: null,
        active_shared_live_media_page: null,
        shared_live_medias: [sharedLiveMedia],
      });
      fetchMock.patch(`/api/videos/${video.id}/end-sharing/`, {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
        body: JSON.stringify(video),
      });

      const onSuccess = jest.fn();
      const onError = jest.fn();
      const { result, waitFor } = renderHook(
        () => useStopSharingMedia(video.id, { onSuccess, onError }),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate();
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${video.id}/end-sharing/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      });
      expect(result.current.data).toEqual(video);
      expect(result.current.status).toEqual('success');

      expect(onSuccess).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('fails to update the resource', async () => {
      const videoId = 'id_video';
      const sharedLiveMedia = sharedLiveMediaMockFactory({ video: videoId });
      const video = videoMockFactory({
        id: videoId,
        active_shared_live_media: sharedLiveMedia,
        active_shared_live_media_page: 1,
        shared_live_medias: [sharedLiveMedia],
      });
      fetchMock.patch(`/api/videos/${video.id}/end-sharing/`, 400);

      const onSuccess = jest.fn();
      const onError = jest.fn();
      const { result, waitFor } = renderHook(
        () => useStopSharingMedia(video.id, { onSuccess, onError }),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate();
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${video.id}/end-sharing/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });
  });
});
