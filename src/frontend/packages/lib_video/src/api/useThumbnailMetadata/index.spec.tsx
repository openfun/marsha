import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';

import { useThumbnailMetadata } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('useThumbnailMetadata', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('requests the thumbnail metadata', async () => {
    const thumbnailMetadata = {
      name: 'Picture List',
      description: 'Viewset for the API of the timed text object.',
      renders: ['application/json', 'text/html'],
      parses: [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
      ],
      upload_max_size_bytes: 100,
    };
    fetchMock.mock(`/api/videos/1234/thumbnails/`, thumbnailMetadata);

    const { result } = renderHook(() => useThumbnailMetadata('1234', 'fr'), {
      wrapper: WrapperReactQuery,
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/1234/thumbnails/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'fr',
      },
      method: 'OPTIONS',
    });
    expect(result.current.data).toEqual(thumbnailMetadata);
    expect(result.current.status).toEqual('success');
  });

  it('fails to get the thumbnail metadata', async () => {
    fetchMock.mock(`/api/videos/4567/thumbnails/`, 401);

    const { result } = renderHook(() => useThumbnailMetadata('4567', 'en'), {
      wrapper: WrapperReactQuery,
    });

    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/4567/thumbnails/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'OPTIONS',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});
