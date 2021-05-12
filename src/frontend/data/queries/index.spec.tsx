import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';
import { renderHook, WrapperComponent } from '@testing-library/react-hooks';

import {
  useCreateVideo,
  useOrganization,
  usePlaylist,
  usePlaylists,
  useThumbnail,
  useTimedTextTracks,
  useVideo,
  useVideos,
} from './index';
import {
  organizationMockFactory,
  playlistMockFactory,
  thumbnailMockFactory,
  timedTextMockFactory,
  videoMockFactory,
} from '../../utils/tests/factories';

setLogger({
  // tslint:disable-next-line:no-console
  log: console.log,
  warn: console.warn,
  // no more errors on the console
  error: () => {},
});

jest.mock('../appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

jest.mock('../../utils/errors/report', () => ({
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
        lti_id: video.playlist.lti_id,
        playlist: video.playlist.id,
        title: video.title,
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
          lti_id: video.playlist.lti_id,
          playlist: video.playlist.id,
          title: video.title,
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
        lti_id: video.playlist.lti_id,
        playlist: video.playlist.id,
        title: video.title,
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
          lti_id: video.playlist.lti_id,
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
});
