import fetchMock from 'fetch-mock';

import { useJwt } from 'hooks/stores/useJwt';
import { FetchResponseError } from 'utils/errors/exception';

import { createOne } from './createOne';

describe('queries/createOne', () => {
  afterEach(() => fetchMock.restore());

  it('creates the resource, handles the response and resolves with a success', async () => {
    useJwt.setState({
      jwt: 'some token',
    });
    const objectToCreate = { objets: 'data' };
    fetchMock.mock('/api/model-name/', { key: 'value' });

    const response = await createOne({
      name: 'model-name',
      object: objectToCreate,
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
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
    useJwt.setState({
      jwt: undefined,
    });
    const objectToCreate = { objets: 'data' };
    fetchMock.mock('/api/model-name/', { key: 'value' });

    const response = await createOne({
      name: 'model-name',
      object: objectToCreate,
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(objectToCreate),
    });
    expect(response).toEqual({ key: 'value' });
  });

  it('resolves with a failure and handles it when it fails to create the resource (local)', async () => {
    useJwt.setState({
      jwt: 'some token',
    });
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
    ).rejects.toThrow('Failed to perform the request');

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(objectToCreate),
    });
  });

  it('resolves with a 404 and handles it when it fails to create the resource (api)', async () => {
    useJwt.setState({
      jwt: 'some token',
    });
    const objectToCreate = { objets: 'data' };
    fetchMock.mock('/api/model-name/', 404);

    let thrownError;

    try {
      await createOne({
        name: 'model-name',
        object: objectToCreate,
      });
    } catch (error) {
      if (error instanceof FetchResponseError) {
        thrownError = error.error;
      }
    }

    expect(thrownError).toEqual({
      code: 'exception',
      response: expect.objectContaining({
        status: 404,
      }),
      message: 'Not Found',
      status: 404,
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(objectToCreate),
    });
  });

  it('resolves with a 400 and handles it when it fails to create the resource (api)', async () => {
    useJwt.setState({
      jwt: 'some token',
    });
    const objectToCreate = { objets: 'data' };
    fetchMock.mock('/api/model-name/', {
      body: JSON.stringify({ error: 'An error occured!' }),
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

    let thrownError;
    try {
      await createOne({
        name: 'model-name',
        object: objectToCreate,
      });
    } catch (error) {
      if (error instanceof FetchResponseError) {
        thrownError = error.error;
      }
    }

    expect(thrownError).toEqual({
      code: 'invalid',
      message: 'Bad Request',
      error: 'An error occured!',
      status: 400,
      response: expect.objectContaining({
        status: 400,
      }),
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(objectToCreate),
    });
  });
});
