import fetchMock from 'fetch-mock';

import { useJwt } from '@lib-components/hooks/stores/useJwt';

import { fetchList } from './fetchList';

describe('queries/fetchList', () => {
  afterEach(() => fetchMock.restore());

  it('requests the resource list, handles the response and resolves with a success', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock('/api/model-name/?limit=999', { key: 'value' });

    const response = await fetchList({
      meta: undefined,
      pageParam: undefined,
      queryKey: ['model-name', undefined],
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/?limit=999');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('requests the resource list with parameters, handles the response and resolves with a success', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock('/api/model-name/?limit=999&key=value', { key: 'value' });

    const response = await fetchList({
      meta: undefined,
      pageParam: undefined,
      queryKey: ['model-name', { key: 'value', foo: undefined }],
    });

    expect(fetchMock.lastCall()?.[0]).toEqual(
      '/api/model-name/?limit=999&key=value',
    );
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('requests the resource list without JWT token', async () => {
    useJwt.getState().resetJwt();

    fetchMock.mock('/api/model-name/?limit=999', { key: 'value' });

    const response = await fetchList({
      meta: undefined,
      pageParam: undefined,
      queryKey: ['model-name'],
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/?limit=999');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('resolves with a failure and handles it when it fails to get the resource list (local)', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock(
      '/api/model-name/?limit=999',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      fetchList({
        meta: undefined,
        pageParam: undefined,
        queryKey: ['model-name'],
      }),
    ).rejects.toThrow('Failed to perform the request');

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/?limit=999');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
  });

  it('resolves with a failure and handles it when it fails to get the resource list (api)', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock('/api/model-name/?limit=999', 404);

    await expect(
      fetchList({
        meta: undefined,
        pageParam: undefined,
        queryKey: ['model-name'],
      }),
    ).rejects.toThrow('Failed to get list of model-name.');

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/?limit=999');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
  });
});
