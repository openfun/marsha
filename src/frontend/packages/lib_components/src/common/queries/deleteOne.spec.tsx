import fetchMock from 'fetch-mock';

import { useJwt } from '../../hooks/stores/useJwt';

import { deleteOne } from './deleteOne';

describe('queries/deleteOne', () => {
  afterEach(() => fetchMock.restore());

  it('deletes the resource', async () => {
    useJwt.setState({
      jwt: 'some token',
    });
    fetchMock.mock('/api/model-name/123/', 204, { method: 'DELETE' });

    await deleteOne({
      name: 'model-name',
      id: '123',
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/123/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });
  });

  it('deletes the resource without JWT token', async () => {
    useJwt.setState({
      jwt: undefined,
    });
    fetchMock.mock('/api/model-name/123/', 403, { method: 'DELETE' });

    let thrownError;
    try {
      await deleteOne({
        name: 'model-name',
        id: '123',
      });
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toEqual({ code: 'exception' });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/123/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });
  });

  it('resolves with a failure and handles it when it fails to delete the resource (local)', async () => {
    useJwt.setState({
      jwt: 'some token',
    });
    fetchMock.mock(
      '/api/model-name/123/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      deleteOne({
        name: 'model-name',
        id: '123',
      }),
    ).rejects.toThrowError('Failed to perform the request');

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/123/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });
  });

  it('resolves with a 400 and handles it when it fails to delete the resource (api)', async () => {
    useJwt.setState({
      jwt: 'some token',
    });
    fetchMock.mock('/api/model-name/123/', {
      body: JSON.stringify({ error: 'An error occured!' }),
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

    let thrownError;
    try {
      await deleteOne({
        name: 'model-name',
        id: '123',
      });
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toEqual({
      code: 'invalid',
      error: 'An error occured!',
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/123/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });
  });
});
