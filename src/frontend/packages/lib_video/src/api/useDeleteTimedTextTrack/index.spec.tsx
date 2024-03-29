import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { timedTextMockFactory } from 'lib-components/tests';
import { WrapperReactQuery } from 'lib-tests';

import { useDeleteTimedTextTrack } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('useDeleteTimedTextTracks', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('deletes the resource', async () => {
    const timedTextTracks = timedTextMockFactory();
    fetchMock.delete(
      `/api/videos/${timedTextTracks.video}/timedtexttracks/${timedTextTracks.id}/`,
      204,
    );

    const { result } = renderHook(() => useDeleteTimedTextTrack(), {
      wrapper: WrapperReactQuery,
    });
    result.current.mutate({
      videoId: timedTextTracks.video,
      timedTextTrackId: timedTextTracks.id,
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${timedTextTracks.video}/timedtexttracks/${timedTextTracks.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'DELETE',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('success');
  });

  it('fails to delete the resource', async () => {
    const timedTextTracks = timedTextMockFactory();
    fetchMock.delete(
      `/api/videos/${timedTextTracks.video}/timedtexttracks/${timedTextTracks.id}/`,
      400,
    );

    const { result } = renderHook(() => useDeleteTimedTextTrack(), {
      wrapper: WrapperReactQuery,
    });
    result.current.mutate({
      videoId: timedTextTracks.video,
      timedTextTrackId: timedTextTracks.id,
    });
    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${timedTextTracks.video}/timedtexttracks/${timedTextTracks.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'DELETE',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});
