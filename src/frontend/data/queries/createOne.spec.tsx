import fetchMock from 'fetch-mock';
import React from 'react';

import { createOne } from './createOne';

let mockAppData = {};
jest.mock('../appData', () => ({
  get appData() {
    return mockAppData;
  },
}));

describe('queries/createOne', () => {
  beforeEach(() => (mockAppData = {}));
  afterEach(() => fetchMock.restore());

  it('creates the resource, handles the response and resolves with a success', async () => {
    mockAppData = { jwt: 'some token' };
    const objectToCreate = { objets: 'data' };
    fetchMock.mock('/api/model-name/', { key: 'value' });

    const response = await createOne({
      name: 'model-name',
      object: objectToCreate,
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(objectToCreate),
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('creates the resource without JWT token', async () => {
    mockAppData = {};
    const objectToCreate = { objets: 'data' };
    fetchMock.mock('/api/model-name/', { key: 'value' });

    const response = await createOne({
      name: 'model-name',
      object: objectToCreate,
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(objectToCreate),
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('resolves with a failure and handles it when it fails to create the resource (local)', async () => {
    mockAppData = { jwt: 'some token' };
    const objectToCreate = { objets: 'data' };
    fetchMock.mock(
      '/api/model-name/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      createOne({
        name: 'model-name',
        object: objectToCreate,
      }),
    ).rejects.toThrowError('Failed to perform the request');

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(objectToCreate),
    });
  });

  it('resolves with a 404 and handles it when it fails to create the resource (api)', async () => {
    mockAppData = { jwt: 'some token' };
    const objectToCreate = { objets: 'data' };
    fetchMock.mock('/api/model-name/', 404);

    let thrownError;

    try {
      await createOne({
        name: 'model-name',
        object: objectToCreate,
      });
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toEqual({ code: 'exception' });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(objectToCreate),
    });
  });

  it('resolves with a 400 and handles it when it fails to create the resource (api)', async () => {
    mockAppData = { jwt: 'some token' };
    const objectToCreate = { objets: 'data' };
    fetchMock.mock('/api/model-name/', 400);

    await expect(
      createOne({
        name: 'model-name',
        object: objectToCreate,
      }),
    ).rejects.toThrow(
      'invalid json response body at /api/model-name/ reason: Unexpected end of JSON input',
    );

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(objectToCreate),
    });
  });
});
