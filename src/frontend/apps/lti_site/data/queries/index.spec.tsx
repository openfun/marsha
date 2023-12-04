import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import {
  documentMockFactory,
  organizationMockFactory,
  playlistMockFactory,
  portabilityRequestMockFactory,
  thumbnailMockFactory,
} from 'lib-components/tests';
import { WrapperReactQuery } from 'lib-tests';

import {
  useCreateDocument,
  useCreatePortabilityRequest,
  useOrganization,
  usePlaylist,
  usePlaylists,
  useThumbnail,
  useUpdatePlaylist,
} from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('queries', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  describe('useOrganization', () => {
    it('requests the resource', async () => {
      const organization = organizationMockFactory();
      fetchMock.mock(`/api/organizations/${organization.id}/`, organization);

      const { result } = renderHook(() => useOrganization(organization.id), {
        wrapper: WrapperReactQuery,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.calls().length).toEqual(1);
      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/organizations/${organization.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
      });
      expect(result.current.data).toEqual(organization);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource', async () => {
      const organization = organizationMockFactory();
      fetchMock.mock(`/api/organizations/${organization.id}/`, 404);

      const { result } = renderHook(() => useOrganization(organization.id), {
        wrapper: WrapperReactQuery,
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/organizations/${organization.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(() => usePlaylist(playlist.id), {
        wrapper: WrapperReactQuery,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/playlists/${playlist.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
      });
      expect(result.current.data).toEqual(playlist);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource', async () => {
      const playlist = playlistMockFactory();
      fetchMock.mock(`/api/playlists/${playlist.id}/`, 404);

      const { result } = renderHook(() => usePlaylist(playlist.id), {
        wrapper: WrapperReactQuery,
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/playlists/${playlist.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(() => useUpdatePlaylist(playlist.id), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/playlists/${playlist.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(() => useUpdatePlaylist(playlist.id), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/playlists/${playlist.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(() => usePlaylists({ organization: '1' }), {
        wrapper: WrapperReactQuery,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/playlists/?limit=999&organization=1',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
      });
      expect(result.current.data).toEqual(playlists);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/playlists/?limit=999&organization=1', 404);

      const { result } = renderHook(() => usePlaylists({ organization: '1' }), {
        wrapper: WrapperReactQuery,
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/playlists/?limit=999&organization=1',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useThumbnail', () => {
    it('requests the resource', async () => {
      const thumbnail = thumbnailMockFactory();
      fetchMock.mock(
        `/api/videos/${thumbnail.video}/thumbnails/${thumbnail.id}/`,
        thumbnail,
      );

      const { result } = renderHook(
        () => useThumbnail(thumbnail.id, thumbnail.video),
        {
          wrapper: WrapperReactQuery,
        },
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.calls().length).toEqual(1);
      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${thumbnail.video}/thumbnails/${thumbnail.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
      });
      expect(result.current.data).toEqual(thumbnail);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource', async () => {
      const thumbnail = thumbnailMockFactory();
      fetchMock.mock(
        `/api/videos/${thumbnail.video}/thumbnails/${thumbnail.id}/`,
        404,
      );

      const { result } = renderHook(
        () => useThumbnail(thumbnail.id, thumbnail.video),
        {
          wrapper: WrapperReactQuery,
        },
      );

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
          'Accept-Language': 'en',
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

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        playlist: document.playlist.id,
        title: document.title!,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/documents/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        playlist: document.playlist.id,
        title: document.title!,
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/documents/`);

      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(() => useCreatePortabilityRequest(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        for_playlist: portabilityRequest.for_playlist.id,
        from_playlist: portabilityRequest.from_playlist.id,
        from_lti_consumer_site: portabilityRequest.from_lti_consumer_site!.id,
        from_lti_user_id: portabilityRequest.from_lti_user_id!,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/portability-requests/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(() => useCreatePortabilityRequest(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        for_playlist: portabilityRequest.for_playlist.id,
        from_playlist: portabilityRequest.from_playlist.id,
        from_lti_consumer_site: portabilityRequest.from_lti_consumer_site!.id,
        from_lti_user_id: portabilityRequest.from_lti_user_id!,
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/portability-requests/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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
