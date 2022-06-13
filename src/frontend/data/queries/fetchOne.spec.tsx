import fetchMock from 'fetch-mock';

import { fetchOne } from './fetchOne';

let mockAppData = {};
jest.mock('../appData', () => ({
  get appData() {
    return mockAppData;
  },
}));

describe('queries/fetchOne', () => {
  beforeEach(() => (mockAppData = {}));
  afterEach(() => fetchMock.restore());

  it('requests the resource, handles the response and resolves with a success', async () => {
    mockAppData = { jwt: 'some token' };
    fetchMock.mock('/api/model-name/1/', { key: 'value' });

    const response = await fetchOne({
      meta: undefined,
      pageParam: undefined,
      queryKey: ['model-name', 1],
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('requests the resource list without JWT token', async () => {
    mockAppData = {};
    fetchMock.mock('/api/model-name/1/', { key: 'value' });

    const response = await fetchOne({
      meta: undefined,
      pageParam: undefined,
      queryKey: ['model-name', 1],
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('resolves with a failure and handles it when it fails to get the resource (local)', async () => {
    mockAppData = { jwt: 'some token' };
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
    ).rejects.toThrowError('Failed to perform the request');

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
  });

  it('resolves with a failure and handles it when it fails to get the resource (api)', async () => {
    mockAppData = { jwt: 'some token' };
    fetchMock.mock('/api/model-name/1/', 404);

    await expect(
      fetchOne({
        meta: undefined,
        pageParam: undefined,
        queryKey: ['model-name', 1],
      }),
    ).rejects.toThrowError('Failed to get /model-name/1/.');

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
  });

  it('requests the resource with a custom endpoint', async () => {
    mockAppData = { jwt: 'some token' };
    fetchMock.mock('/api/model-name/1/action/', { key: 'value' });

    const response = await fetchOne({
      meta: undefined,
      pageParam: undefined,
      queryKey: ['model-name', 1, 'action'],
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('requests the resource with a custom endpoint list without JWT token', async () => {
    mockAppData = {};
    fetchMock.mock('/api/model-name/1/action/', { key: 'value' });

    const response = await fetchOne({
      meta: undefined,
      pageParam: undefined,
      queryKey: ['model-name', 1, 'action'],
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('resolves with a failure with a custom endpoint and handles it when it fails to get the resource (local)', async () => {
    mockAppData = { jwt: 'some token' };
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
    ).rejects.toThrowError('Failed to perform the request');

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
  });

  it('resolves with a failure with a custom endpoint and handles it when it fails to get the resource (api)', async () => {
    mockAppData = { jwt: 'some token' };
    fetchMock.mock('/api/model-name/1/action/', 404);

    await expect(
      fetchOne({
        meta: undefined,
        pageParam: undefined,
        queryKey: ['model-name', 1, 'action'],
      }),
    ).rejects.toThrowError('Failed to get /model-name/1/action/.');

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
  });
});
