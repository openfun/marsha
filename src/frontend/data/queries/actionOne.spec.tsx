import fetchMock from 'fetch-mock';

import { actionOne } from './actionOne';

let mockAppData = {};
jest.mock('data/appData', () => ({
  get appData() {
    return mockAppData;
  },
}));

describe('queries/actionOne', () => {
  beforeEach(() => (mockAppData = {}));
  afterEach(() => fetchMock.restore());

  it('requests the resource, handles the response and resolves with a success', async () => {
    mockAppData = { jwt: 'some token' };
    const objectToUpdate = { object: 'data' };
    fetchMock.mock('/api/model-name/1/action/', { key: 'value' });

    const response = await actionOne({
      name: 'model-name',
      id: '1',
      action: 'action',
      object: objectToUpdate,
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(objectToUpdate),
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('allows empty request body', async () => {
    mockAppData = { jwt: 'some token' };
    fetchMock.mock('/api/model-name/1/action/', { key: 'value' });

    const response = await actionOne({
      name: 'model-name',
      id: '1',
      action: 'action',
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('allows defining request method', async () => {
    mockAppData = { jwt: 'some token' };
    const objectToUpdate = { object: 'data' };
    fetchMock.mock('/api/model-name/1/action/', { key: 'value' });

    const response = await actionOne({
      name: 'model-name',
      id: '1',
      action: 'action',
      method: 'GET',
      object: objectToUpdate,
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'GET',
      body: JSON.stringify(objectToUpdate),
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('requests the resource list without JWT token', async () => {
    mockAppData = {};
    const objectToUpdate = { object: 'data' };
    fetchMock.mock('/api/model-name/1/action/', { key: 'value' });

    const response = await actionOne({
      name: 'model-name',
      id: '1',
      action: 'action',
      object: objectToUpdate,
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(objectToUpdate),
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('resolves with a failure and handles it when it fails to get the resource (local)', async () => {
    mockAppData = { jwt: 'some token' };
    const objectToUpdate = { object: 'data' };
    fetchMock.mock(
      '/api/model-name/1/action/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      actionOne({
        name: 'model-name',
        id: '1',
        action: 'action',
        object: objectToUpdate,
      }),
    ).rejects.toThrowError('Failed to perform the request');

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(objectToUpdate),
    });
  });

  it('resolves with a failure and handles it when it fails to get the resource (api)', async () => {
    mockAppData = { jwt: 'some token' };
    const objectToUpdate = { object: 'data' };
    fetchMock.mock('/api/model-name/1/action/', 404);

    let thrownError;

    try {
      await actionOne({
        name: 'model-name',
        id: '1',
        action: 'action',
        object: objectToUpdate,
      });
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toEqual({ code: 'exception' });

    expect(fetchMock.lastCall()![0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(objectToUpdate),
    });
  });
});
