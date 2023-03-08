import fetchMock from 'fetch-mock';

import { useJwt } from 'hooks/stores/useJwt';
import { FetchResponseError } from 'utils/errors/exception';

import { actionOne } from './actionOne';

describe('queries/actionOne', () => {
  afterEach(() => fetchMock.restore());

  it('requests the resource, handles the response and resolves with a success', async () => {
    useJwt.getState().setJwt('some token');

    const objectToUpdate = { object: 'data' };
    fetchMock.mock('/api/model-name/1/action/', { key: 'value' });

    const response = await actionOne({
      name: 'model-name',
      id: '1',
      action: 'action',
      object: objectToUpdate,
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
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
    useJwt.getState().setJwt('some token');

    fetchMock.mock('/api/model-name/1/action/', { key: 'value' });

    const response = await actionOne({
      name: 'model-name',
      id: '1',
      action: 'action',
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('allows defining request method', async () => {
    useJwt.getState().setJwt('some token');

    const objectToUpdate = { object: 'data' };
    fetchMock.mock('/api/model-name/1/action/', { key: 'value' });

    const response = await actionOne({
      name: 'model-name',
      id: '1',
      action: 'action',
      method: 'GET',
      object: objectToUpdate,
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
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
    useJwt.getState().resetJwt();

    const objectToUpdate = { object: 'data' };
    fetchMock.mock('/api/model-name/1/action/', { key: 'value' });

    const response = await actionOne({
      name: 'model-name',
      id: '1',
      action: 'action',
      object: objectToUpdate,
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(objectToUpdate),
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('resolves with a failure and handles it when it fails to get the resource (local)', async () => {
    useJwt.getState().setJwt('some token');

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
    ).rejects.toThrow('Failed to perform the request');

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(objectToUpdate),
    });
  });

  it('resolves with a failure and handles it when it fails to get the resource (api)', async () => {
    useJwt.getState().setJwt('some token');

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
      if (error instanceof FetchResponseError) {
        thrownError = error.error;
      }
    }

    expect(thrownError).toEqual({
      code: 'exception',
      message: 'Not Found',
      status: 404,
      response: expect.objectContaining({
        status: 404,
      }),
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/1/action/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(objectToUpdate),
    });
  });
});
