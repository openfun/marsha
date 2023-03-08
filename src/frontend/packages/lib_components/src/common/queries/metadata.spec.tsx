import fetchMock from 'fetch-mock';

import { useJwt } from 'hooks/stores/useJwt';

import { metadata } from './metadata';

describe('metadata', () => {
  afterEach(() => fetchMock.restore());

  it('requests the metadata, handles the response and resolves with a success', async () => {
    useJwt.getState().setJwt('some token');
    fetchMock.mock('/api/model-name/', { key: 'value' });

    const response = await metadata({
      meta: undefined,
      pageParam: undefined,
      queryKey: ['model-name', 'fr'],
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'fr',
      },
      method: 'OPTIONS',
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('requests the metadata without JWT token', async () => {
    useJwt.getState().resetJwt();

    fetchMock.mock('/api/model-name/', { key: 'value' });

    const response = await metadata({
      meta: undefined,
      pageParam: undefined,
      queryKey: ['model-name', 'en'],
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'OPTIONS',
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('resolves with a failure and handles it when it fails to get the resource (local)', async () => {
    useJwt.getState().setJwt('some token');
    fetchMock.mock(
      '/api/model-name/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      metadata({
        meta: undefined,
        pageParam: undefined,
        queryKey: ['model-name', 'fr'],
      }),
    ).rejects.toThrow('Failed to perform the request');

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'fr',
      },
      method: 'OPTIONS',
    });
  });

  it('resolves with a failure and handles it when it fails to get the resource (api)', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock('/api/model-name/', 404);

    await expect(
      metadata({
        meta: undefined,
        pageParam: undefined,
        queryKey: ['model-name', 'fr'],
      }),
    ).rejects.toThrow('Failed to get metadata for /model-name/.');

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'fr',
      },
      method: 'OPTIONS',
    });
  });
});
