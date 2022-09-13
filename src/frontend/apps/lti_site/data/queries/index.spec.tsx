import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useJwt } from 'data/stores/useJwt';
import { LiveModeType } from 'types/tracks';
import {
  documentMockFactory,
  liveSessionFactory,
  organizationMockFactory,
  liveAttendanceFactory,
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
  useDeleteThumbnail,
  useLiveAttendances,
  useOrganization,
  usePairingVideo,
  usePlaylist,
  usePlaylists,
  useStatsVideo,
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
  useLiveSessionsQuery,
  useDeleteTimedTextTrack,
  useVideoMetadata,
} from '.';

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

let Wrapper: React.ComponentType<React.PropsWithChildren<{}>>;

describe('queries', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });

    const queryClient = new QueryClient({
      // tslint:disable-next-line:no-console
      logger: { log: console.log, warn: console.warn, error: () => {} },
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    Wrapper = ({ children }: React.PropsWithChildren<{}>) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  describe('useLiveAttendances', () => {
    it('requests the resource list', async () => {
      const liveAttendances = liveAttendanceFactory({
        live_attendance: {
          [Date.now()]: {
            fullScreen: true,
          },
        },
      });
      fetchMock.mock(
        '/api/livesessions/list_attendances/?limit=999',
        liveAttendances,
      );

      const { result } = renderHook(() => useLiveAttendances(), {
        wrapper: Wrapper,
      });
      await waitFor(() => expect(result.current.status).toEqual('success'));

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/livesessions/list_attendances/?limit=999',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(liveAttendances);
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/livesessions/list_attendances/?limit=999', 404);

      const { result } = renderHook(() => useLiveAttendances(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/livesessions/list_attendances/?limit=999',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(undefined);
    });
  });

  describe('useOrganization', () => {
    it('requests the resource', async () => {
      const organization = organizationMockFactory();
      fetchMock.mock(`/api/organizations/${organization.id}/`, organization);

      const { result } = renderHook(() => useOrganization(organization.id), {
        wrapper: Wrapper,
      });
      await waitFor(() => expect(result.current.status).toEqual('success'));

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
    });

    it('fails to get the resource', async () => {
      const organization = organizationMockFactory();
      fetchMock.mock(`/api/organizations/${organization.id}/`, 404);

      const { result } = renderHook(() => useOrganization(organization.id), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
    });
  });

  describe('usePlaylist', () => {
    it('requests the resource', async () => {
      const playlist = playlistMockFactory();
      fetchMock.mock(`/api/playlists/${playlist.id}/`, playlist);

      const { result } = renderHook(() => usePlaylist(playlist.id), {
        wrapper: Wrapper,
      });
      await waitFor(() => expect(result.current.status).toEqual('success'));

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
    });

    it('fails to get the resource', async () => {
      const playlist = playlistMockFactory();
      fetchMock.mock(`/api/playlists/${playlist.id}/`, 404);

      const { result } = renderHook(() => usePlaylist(playlist.id), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
    });
  });

  describe('useUpdatePlaylist', () => {
    it('updates the resource', async () => {
      const playlist = playlistMockFactory();
      fetchMock.patch(`/api/playlists/${playlist.id}/`, playlist);

      const { result } = renderHook(() => useUpdatePlaylist(playlist.id), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        title: 'updated title',
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
    });

    it('fails to update the resource', async () => {
      const playlist = playlistMockFactory();
      fetchMock.patch(`/api/playlists/${playlist.id}/`, 400);

      const { result } = renderHook(() => useUpdatePlaylist(playlist.id), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => expect(result.current.status).toEqual('error'));

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
    });
  });

  describe('usePlaylists', () => {
    it('requests the resource list', async () => {
      const playlists = Array(4).fill(playlistMockFactory());
      fetchMock.mock('/api/playlists/?organization=1&limit=999', playlists);

      const { result } = renderHook(() => usePlaylists({ organization: '1' }), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/playlists/?organization=1&limit=999', 404);

      const { result } = renderHook(() => usePlaylists({ organization: '1' }), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
    });
  });

  describe('useThumbnail', () => {
    it('requests the resource', async () => {
      const thumbnail = thumbnailMockFactory();
      fetchMock.mock(`/api/thumbnails/${thumbnail.id}/`, thumbnail);

      const { result } = renderHook(() => useThumbnail(thumbnail.id), {
        wrapper: Wrapper,
      });
      await waitFor(() => expect(result.current.status).toEqual('success'));

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
    });

    it('fails to get the resource', async () => {
      const thumbnail = thumbnailMockFactory();
      fetchMock.mock(`/api/thumbnails/${thumbnail.id}/`, 404);

      const { result } = renderHook(() => useThumbnail(thumbnail.id), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
    });
  });

  describe('useDeleteThumbnail', () => {
    it('deletes the resource', async () => {
      const thumbnail = thumbnailMockFactory();
      fetchMock.delete(`/api/thumbnails/${thumbnail.id}/`, 204);

      const { result } = renderHook(() => useDeleteThumbnail(), {
        wrapper: Wrapper,
      });
      result.current.mutate(thumbnail.id);
      await waitFor(() => expect(result.current.status).toEqual('success'));

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/thumbnails/${thumbnail.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      });
      expect(result.current.data).toEqual(undefined);
    });

    it('fails to delete the resource', async () => {
      const thumbnail = thumbnailMockFactory();
      fetchMock.delete(`/api/thumbnails/${thumbnail.id}/`, 400);

      const { result } = renderHook(() => useDeleteThumbnail(), {
        wrapper: Wrapper,
      });
      result.current.mutate(thumbnail.id);
      await waitFor(() => expect(result.current.status).toEqual('error'));

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/thumbnails/${thumbnail.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      });
      expect(result.current.data).toEqual(undefined);
    });
  });

  describe('useTimedTextTracks', () => {
    it('requests the resource list', async () => {
      const timedTextTracks = Array(4).fill(timedTextMockFactory());
      fetchMock.mock(
        '/api/timedtexttracks/?video=1&limit=999',
        timedTextTracks,
      );

      const { result } = renderHook(() => useTimedTextTracks({ video: '1' }), {
        wrapper: Wrapper,
      });
      await waitFor(() => expect(result.current.status).toEqual('success'));

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
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/timedtexttracks/?video=1&limit=999', 404);

      const { result } = renderHook(() => useTimedTextTracks({ video: '1' }), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
    });
  });

  describe('useDeleteTimedTextTracks', () => {
    it('deletes the resource', async () => {
      const timedTextTracks = timedTextMockFactory();
      fetchMock.delete(`/api/timedtexttracks/${timedTextTracks.id}/`, 204);

      const { result } = renderHook(() => useDeleteTimedTextTrack(), {
        wrapper: Wrapper,
      });
      result.current.mutate(timedTextTracks.id);
      await waitFor(() => expect(result.current.status).toEqual('success'));

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/timedtexttracks/${timedTextTracks.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      });
      expect(result.current.data).toEqual(undefined);
    });

    it('fails to delete the resource', async () => {
      const timedTextTracks = timedTextMockFactory();
      fetchMock.delete(`/api/timedtexttracks/${timedTextTracks.id}/`, 400);

      const { result } = renderHook(() => useDeleteTimedTextTrack(), {
        wrapper: Wrapper,
      });
      result.current.mutate(timedTextTracks.id);

      await waitFor(() => expect(result.current.status).toEqual('error'));

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/timedtexttracks/${timedTextTracks.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      });
      expect(result.current.data).toEqual(undefined);
    });
  });

  describe('useCreateVideo', () => {
    it('creates the resource', async () => {
      const video = videoMockFactory();
      fetchMock.post('/api/videos/', video);

      const { result } = renderHook(() => useCreateVideo(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        playlist: video.playlist.id,
        title: video.title!,
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
    });

    it('creates the resource with description', async () => {
      const video = videoMockFactory();
      fetchMock.post('/api/videos/', video);

      const { result } = renderHook(() => useCreateVideo(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        playlist: video.playlist.id,
        title: video.title!,
        description: video.description!,
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        playlist: video.playlist.id,
        title: video.title!,
        live_type: LiveModeType.JITSI,
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
        wrapper: Wrapper,
      });
      result.current.mutate({
        playlist: video.playlist.id,
        title: video.title!,
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
    });
  });

  describe('useUpdateVideo', () => {
    it('updates the resource', async () => {
      const video = videoMockFactory();
      fetchMock.patch(`/api/videos/${video.id}/`, video);

      const { result } = renderHook(() => useUpdateVideo(video.id), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        title: 'updated title',
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
    });

    it('fails to update the resource', async () => {
      const video = videoMockFactory();
      fetchMock.patch(`/api/videos/${video.id}/`, 400);

      const { result } = renderHook(() => useUpdateVideo(video.id), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => expect(result.current.status).toEqual('error'));

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
    });
  });

  describe('useVideo', () => {
    it('requests the resource', async () => {
      const video = videoMockFactory();
      fetchMock.mock(`/api/videos/${video.id}/`, video);

      const { result } = renderHook(() => useVideo(video.id), {
        wrapper: Wrapper,
      });
      await waitFor(() => expect(result.current.status).toEqual('success'));

      expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(video);
    });

    it('fails to get the resource', async () => {
      const video = videoMockFactory();
      fetchMock.mock(`/api/videos/${video.id}/`, 404);

      const { result } = renderHook(() => useVideo(video.id), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

      expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(undefined);
    });
  });

  describe('useVideoMetadata', () => {
    it('requests the video metadata', async () => {
      const videoMetadata = {
        name: 'Video List',
        description: 'Viewset for the API of the video object.',
        renders: ['application/json', 'text/html'],
        parses: [
          'application/json',
          'application/x-www-form-urlencoded',
          'multipart/form-data',
        ],
        live: {
          segment_duration_seconds: 4,
        },
      };
      fetchMock.mock(`/api/videos/`, videoMetadata);

      const { result } = renderHook(() => useVideoMetadata('fr'), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

      expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'fr',
        },
        method: 'OPTIONS',
      });
      expect(result.current.data).toEqual(videoMetadata);
    });

    it('fails to get the video metadata', async () => {
      fetchMock.mock(`/api/videos/`, 404);

      const { result } = renderHook(() => useVideoMetadata('en'), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

      expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
        method: 'OPTIONS',
      });
      expect(result.current.data).toEqual(undefined);
    });
  });

  describe('useVideos', () => {
    it('requests the resource list', async () => {
      const videos = Array(4).fill(videoMockFactory());
      fetchMock.mock('/api/videos/?organization=1&limit=999', videos);

      const { result } = renderHook(() => useVideos({ organization: '1' }), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/videos/?organization=1&limit=999', 404);

      const { result } = renderHook(() => useVideos({ organization: '1' }), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
    });
  });

  describe('usePairingingVideo', () => {
    it('updates the resource', async () => {
      const video = videoMockFactory();
      fetchMock.get(`/api/videos/${video.id}/pairing-secret/`, {
        secret: '12345',
      });

      const { result } = renderHook(() => usePairingVideo(video.id), {
        wrapper: Wrapper,
      });
      result.current.mutate();

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
    });

    it('fails to update the resource', async () => {
      const video = videoMockFactory();
      fetchMock.get(`/api/videos/${video.id}/pairing-secret/`, 400);

      const { result } = renderHook(() => usePairingVideo(video.id), {
        wrapper: Wrapper,
      });
      result.current.mutate();

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
    });
  });

  describe('useStartLiveRecording', () => {
    it('updates the resource', async () => {
      const video = videoMockFactory();
      fetchMock.patch(`/api/videos/${video.id}/start-recording/`, video);

      const onError = jest.fn();
      const { result } = renderHook(
        () => useStartLiveRecording(video.id, onError),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate();

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
      expect(onError).not.toHaveBeenCalled();
    });

    it('fails to update the resource', async () => {
      const video = videoMockFactory();
      fetchMock.patch(`/api/videos/${video.id}/start-recording/`, 400);

      const onError = jest.fn();
      const { result } = renderHook(
        () => useStartLiveRecording(video.id, onError),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate();

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('useStopLiveRecording', () => {
    it('updates the resource', async () => {
      const video = videoMockFactory();
      fetchMock.patch(`/api/videos/${video.id}/stop-recording/`, video);

      const onError = jest.fn();
      const { result } = renderHook(
        () => useStopLiveRecording(video.id, onError),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate();

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
      expect(onError).not.toHaveBeenCalled();
    });

    it('fails to update the resource', async () => {
      const video = videoMockFactory();
      fetchMock.patch(`/api/videos/${video.id}/stop-recording/`, 400);

      const onError = jest.fn();
      const { result } = renderHook(
        () => useStopLiveRecording(video.id, onError),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate();

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('useCreateDocument', () => {
    it('creates the resource', async () => {
      const document = documentMockFactory();
      fetchMock.post('/api/documents/', document);

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        playlist: document.playlist.id,
        title: document.title!,
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
    });

    it('fails to create the resource', async () => {
      const document = documentMockFactory();
      fetchMock.post('/api/documents/', 400);

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        playlist: document.playlist.id,
        title: document.title!,
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
    });
  });

  describe('useStatsVideo', () => {
    it('updates the resource', async () => {
      const video = videoMockFactory();
      fetchMock.get(`/api/videos/${video.id}/stats/`, {
        nb_views: 123,
      });

      const { result } = renderHook(() => useStatsVideo(video.id), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${video.id}/stats/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual({ nb_views: 123 });
    });

    it('fails to update the resource', async () => {
      const video = videoMockFactory();
      fetchMock.get(`/api/videos/${video.id}/stats/`, 400);

      const { result } = renderHook(() => useStatsVideo(video.id), {
        wrapper: Wrapper,
      });
      await waitFor(() => expect(result.current.status).toEqual('error'));

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${video.id}/stats/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(undefined);
    });
  });

  describe('useUpdateSharedLiveMedia', () => {
    it('updates the resource', async () => {
      const sharedLiveMedia = sharedLiveMediaMockFactory();
      fetchMock.patch(
        `/api/sharedlivemedias/${sharedLiveMedia.id}/`,
        sharedLiveMedia,
      );

      const { result } = renderHook(
        () => useUpdateSharedLiveMedia(sharedLiveMedia.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
    });

    it('fails to update the resource', async () => {
      const sharedLiveMedia = sharedLiveMediaMockFactory();
      fetchMock.patch(`/api/sharedlivemedias/${sharedLiveMedia.id}/`, 400);

      const { result } = renderHook(
        () => useUpdateSharedLiveMedia(sharedLiveMedia.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
    });
  });

  describe('useDeleteSharedLiveMedia', () => {
    it('deletes the resource', async () => {
      const sharedLiveMedia = sharedLiveMediaMockFactory();
      fetchMock.delete(`/api/sharedlivemedias/${sharedLiveMedia.id}/`, 204);

      const { result } = renderHook(() => useDeleteSharedLiveMedia(), {
        wrapper: Wrapper,
      });
      result.current.mutate(sharedLiveMedia.id);
      await waitFor(() => expect(result.current.status).toEqual('success'));

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
    });

    it('fails to delete the resource', async () => {
      const sharedLiveMedia = sharedLiveMediaMockFactory();
      fetchMock.delete(`/api/sharedlivemedias/${sharedLiveMedia.id}/`, 400);

      const { result } = renderHook(() => useDeleteSharedLiveMedia(), {
        wrapper: Wrapper,
      });
      result.current.mutate(sharedLiveMedia.id);

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
      const { result } = renderHook(
        () => useStartSharingMedia(video.id, { onSuccess, onError }),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({ sharedlivemedia: sharedLiveMedia.id });

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
      const { result } = renderHook(
        () => useStartSharingMedia(video.id, { onSuccess, onError }),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({ sharedlivemedia: sharedLiveMedia.id });

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
      const { result } = renderHook(
        () => useStopSharingMedia(video.id, { onSuccess, onError }),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate();

      await waitFor(() => expect(result.current.status).toEqual('success'));

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
      const { result } = renderHook(
        () => useStopSharingMedia(video.id, { onSuccess, onError }),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate();

      await waitFor(() => expect(result.current.status).toEqual('error'));

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
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('useLiveSessions', () => {
    it('requests the resource list', async () => {
      const liveSessions = Array(4).fill(liveSessionFactory());
      fetchMock.mock('/api/livesessions/?limit=999', liveSessions);

      const { result } = renderHook(() => useLiveSessionsQuery({}), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

      expect(fetchMock.lastCall()![0]).toEqual('/api/livesessions/?limit=999');
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(liveSessions);
    });

    it('requests live sessions with an anonymous_id', async () => {
      const liveSessions = Array(4).fill(liveSessionFactory());
      const anonymousId = uuidv4();
      fetchMock.mock(
        `/api/livesessions/?anonymous_id=${anonymousId}&limit=999`,
        liveSessions,
      );

      const { result } = renderHook(
        () => useLiveSessionsQuery({ anonymous_id: anonymousId }),
        {
          wrapper: Wrapper,
        },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/livesessions/?anonymous_id=${anonymousId}&limit=999`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(liveSessions);
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/livesessions/?limit=999', 404);

      const { result } = renderHook(() => useLiveSessionsQuery({}), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

      expect(fetchMock.lastCall()![0]).toEqual('/api/livesessions/?limit=999');
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(undefined);
    });
  });
});
