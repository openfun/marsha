import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt, videoMockFactory } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';

import { useVideo, useVideos } from '.';

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

  describe('useVideo', () => {
    it('requests the resource', async () => {
      const video = videoMockFactory();
      fetchMock.mock(`/api/videos/${video.id}/`, video);

      const { result } = renderHook(() => useVideo(video.id), {
        wrapper: WrapperReactQuery,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

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

      const { result } = renderHook(() => useVideo(video.id), {
        wrapper: WrapperReactQuery,
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

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

      const { result } = renderHook(() => useVideos({ organization: '1' }), {
        wrapper: WrapperReactQuery,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

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

      const { result } = renderHook(() => useVideos({ organization: '1' }), {
        wrapper: WrapperReactQuery,
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

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
});
