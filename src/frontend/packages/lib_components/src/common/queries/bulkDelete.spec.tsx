import fetchMock from 'fetch-mock';

import { useJwt } from '@lib-components/hooks/stores/useJwt';
import { FetchResponseError } from '@lib-components/utils/errors/exception';

import { bulkDelete } from './bulkDelete';

describe('queries/bulkDelete', () => {
  afterEach(() => fetchMock.restore());

  it('deletes the resources', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock('/api/model-name/', {
      status: 204,
      method: 'DELETE',
      body: { ids: ['id1', 'id2'] },
    });

    await bulkDelete({
      name: 'model-name',
      objects: { ids: ['id1', 'id2'] },
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
      body: '{"ids":["id1","id2"]}',
    });
  });

  it('cannot delete the resources without JWT token', async () => {
    useJwt.getState().resetJwt();

    fetchMock.mock('/api/model-name/', 403, {
      method: 'DELETE',
      body: { ids: ['id1', 'id2'] },
    });

    let thrownError;
    try {
      await bulkDelete({
        name: 'model-name',
        objects: { ids: ['id1', 'id2'] },
      });
    } catch (error) {
      if (error instanceof FetchResponseError) {
        thrownError = error.error;
      }
    }

    expect(thrownError).toEqual({
      code: 'exception',
      status: 403,
      message: 'Forbidden',
      response: expect.objectContaining({
        status: 403,
      }),
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
      body: '{"ids":["id1","id2"]}',
    });
  });

  it('resolves with a failure and handles it when it fails to delete the resource (local)', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock(
      '/api/model-name/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      bulkDelete({
        name: 'model-name',
        objects: { ids: ['id1', 'id2'] },
      }),
    ).rejects.toThrow('Failed to perform the request');

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/model-name/');
    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
      body: '{"ids":["id1","id2"]}',
    });
  });

  it('resolves with a 400 and handles it when it fails to delete the resource (api)', async () => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock('/api/model-name/', {
      body: JSON.stringify({ error: 'An error occured!' }),
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

    let thrownError;
    try {
      await bulkDelete({
        name: 'model-name',
        objects: { ids: ['id1', 'id2'] },
      });
    } catch (error) {
      if (error instanceof FetchResponseError) {
        thrownError = error.error;
      }
    }

    expect(thrownError).toEqual({
      code: 'invalid',
      message: 'Bad Request',
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
      method: 'DELETE',
      body: '{"ids":["id1","id2"]}',
    });
  });
});
