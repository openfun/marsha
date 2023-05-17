import { WrapperComponent, renderHook } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { useJwt, videoMockFactory } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';

import { useDeleteVideos } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

let Wrapper: WrapperComponent<Element>;

describe('useDeleteVideos', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
    Wrapper = WrapperReactQuery;
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('deletes multiples resources', async () => {
    const video1 = videoMockFactory();
    const video2 = videoMockFactory();

    fetchMock.delete('/api/videos/', {
      status: 204,
      body: { ids: [video1.id, video2.id] },
    });
    const { result, waitFor } = renderHook(() => useDeleteVideos(), {
      wrapper: Wrapper,
    });
    result.current.mutate({ ids: [video1.id, video2.id] });
    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      body: `{"ids":["${video1.id}","${video2.id}"]}`,
      method: 'DELETE',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('success');
  });

  it('fails to delete the resources', async () => {
    const video = videoMockFactory();
    fetchMock.delete('/api/videos/', {
      status: 400,
    });

    const { result, waitFor } = renderHook(() => useDeleteVideos(), {
      wrapper: Wrapper,
    });
    result.current.mutate({ ids: [video.id] });

    await waitFor(() => result.current.isError);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      body: `{"ids":["${video.id}"]}`,
      method: 'DELETE',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});
