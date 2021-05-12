import fetchMock from 'fetch-mock';
import React from 'react';

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
      fetchOne({ pageParam: undefined, queryKey: ['model-name', 1] }),
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
      fetchOne({ pageParam: undefined, queryKey: ['model-name', 1] }),
    ).rejects.toThrowError('Failed to get /model-name/1/.');

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
  });
});
