import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';

import { useDepositedFileMetadata } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('useDepositedFileMetadata', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('requests the deposited file metadata', async () => {
    const fileDepositoryId = '1';
    const depositedFileMetadata = {
      name: 'Deposited files List',
      description: 'Viewset for the API of the deposited file object.',
      renders: ['application/json', 'text/html'],
      parses: [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
      ],
      upload_max_size_bytes: 100,
    };
    fetchMock.mock(
      `/api/filedepositories/${fileDepositoryId}/depositedfiles/`,
      depositedFileMetadata,
    );

    const { result } = renderHook(
      () => useDepositedFileMetadata('fr', fileDepositoryId),
      {
        wrapper: WrapperReactQuery,
      },
    );
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/filedepositories/${fileDepositoryId}/depositedfiles/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'fr',
      },
      method: 'OPTIONS',
    });
    expect(result.current.data).toEqual(depositedFileMetadata);
    expect(result.current.status).toEqual('success');
  });

  it('fails to get the deposited file metadata', async () => {
    const fileDepositoryId = '1';
    fetchMock.mock(
      `/api/filedepositories/${fileDepositoryId}/depositedfiles/`,
      404,
    );

    const { result } = renderHook(
      () => useDepositedFileMetadata('en', fileDepositoryId),
      {
        wrapper: WrapperReactQuery,
      },
    );

    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/filedepositories/${fileDepositoryId}/depositedfiles/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'OPTIONS',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});
