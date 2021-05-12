import fetchMock from 'fetch-mock';
import React from 'react';

import { fetchList } from './fetchList';

let mockAppData = {};
jest.mock('../appData', () => ({
  get appData() {
    return mockAppData;
  },
}));

describe('queries/fetchList', () => {
  beforeEach(() => (mockAppData = {}));
  afterEach(() => fetchMock.restore());

  it('requests the resource list, handles the response and resolves with a success', async () => {
    mockAppData = { jwt: 'some token' };
    fetchMock.mock('/api/model-name/?limit=999', { key: 'value' });

    const response = await fetchList({
      pageParam: undefined,
      queryKey: ['model-name'],
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/?limit=999');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('requests the resource list with parameters, handles the response and resolves with a success', async () => {
    mockAppData = { jwt: 'some token' };
    fetchMock.mock('/api/model-name/?key=value&limit=999', { key: 'value' });

    const response = await fetchList({
      pageParam: undefined,
      queryKey: ['model-name', { key: 'value' }],
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      '/api/model-name/?key=value&limit=999',
    );
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
    fetchMock.mock('/api/model-name/?limit=999', { key: 'value' });

    const response = await fetchList({
      pageParam: undefined,
      queryKey: ['model-name'],
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/?limit=999');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('resolves with a failure and handles it when it fails to get the resource list (local)', async () => {
    mockAppData = { jwt: 'some token' };
    fetchMock.mock(
      '/api/model-name/?limit=999',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      fetchList({ pageParam: undefined, queryKey: ['model-name'] }),
    ).rejects.toThrowError('Failed to perform the request');

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/?limit=999');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
  });

  it('resolves with a failure and handles it when it fails to get the resource list (api)', async () => {
    mockAppData = { jwt: 'some token' };
    fetchMock.mock('/api/model-name/?limit=999', 404);

    await expect(
      fetchList({ pageParam: undefined, queryKey: ['model-name'] }),
    ).rejects.toThrowError('Failed to get list of model-name.');

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/?limit=999');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
  });
});
