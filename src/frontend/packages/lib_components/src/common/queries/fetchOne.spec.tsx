import fetchMock from 'fetch-mock';

import { useJwt } from 'hooks/stores/useJwt';

import { fetchOne } from './fetchOne';

describe('queries/fetchOne', () => {
  afterEach(() => fetchMock.restore());

  it('requests the resource, handles the response and resolves with a success', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock('/api/model-name/1/', { key: 'value' });

    const response = await fetchOne({
      meta: undefined,
      pageParam: undefined,
      queryKey: ['model-name', 1],
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/');
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

    fetchMock.mock('/api/model-name/1/', { key: 'value' });

    const response = await fetchOne({
      meta: undefined,
      pageParam: undefined,
      queryKey: ['model-name', 1],
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('resolves with a failure and handles it when it fails to get the resource (local)', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock(
      '/api/model-name/1/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      fetchOne({
        meta: undefined,
        pageParam: undefined,
        queryKey: ['model-name', 1],
      }),
    ).rejects.toThrow('Failed to perform the request');

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
  });

  it('resolves with a failure and handles it when it fails to get the resource (api)', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock('/api/model-name/1/', 404);

    await expect(
      fetchOne({
        meta: undefined,
        pageParam: undefined,
        queryKey: ['model-name', 1],
      }),
    ).rejects.toThrow('Failed to get /api/model-name/1/.');

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
  });

  it('requests the resource with a custom endpoint', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock('/api/model-name/1/action/', { key: 'value' });

    const response = await fetchOne({
      meta: undefined,
      pageParam: undefined,
      queryKey: ['model-name', 1, 'action'],
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('requests the resource with a custom endpoint list without JWT token', async () => {
    useJwt.getState().resetJwt();

    fetchMock.mock('/api/model-name/1/action/', { key: 'value' });

    const response = await fetchOne({
      meta: undefined,
      pageParam: undefined,
      queryKey: ['model-name', 1, 'action'],
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('resolves with a failure with a custom endpoint and handles it when it fails to get the resource (local)', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock(
      '/api/model-name/1/action/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      fetchOne({
        meta: undefined,
        pageParam: undefined,
        queryKey: ['model-name', 1, 'action'],
      }),
    ).rejects.toThrow('Failed to perform the request');

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
  });

  it('resolves with a failure with a custom endpoint and handles it when it fails to get the resource (api)', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock('/api/model-name/1/action/', 404);

    await expect(
      fetchOne({
        meta: undefined,
        pageParam: undefined,
        queryKey: ['model-name', 1, 'action'],
      }),
    ).rejects.toThrow('Failed to get /api/model-name/1/action/.');

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
  });
});
