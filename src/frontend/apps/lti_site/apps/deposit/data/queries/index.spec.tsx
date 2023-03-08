import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { renderHook, WrapperComponent } from '@testing-library/react-hooks';

import {
  depositedFileMockFactory,
  fileDepositoryMockFactory,
} from 'apps/deposit/utils/tests/factories';

import {
  useFileDepository,
  useFileDepositories,
  useCreateFileDepository,
  useUpdateFileDepository,
  useDepositedFiles,
  useUpdateDepositedFile,
} from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

let Wrapper: WrapperComponent<Element>;

describe('queries', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    Wrapper = ({ children }: Element) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  describe('useFileDepositories', () => {
    it('requests the resource list', async () => {
      const fileDepositories = Array(4).fill(fileDepositoryMockFactory());
      fetchMock.mock(
        '/api/filedepositories/?limit=999&organization=1',
        fileDepositories,
      );

      const { result, waitFor } = renderHook(
        () => useFileDepositories({ organization: '1' }),
        {
          wrapper: Wrapper,
        },
      );
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/filedepositories/?limit=999&organization=1',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(fileDepositories);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/filedepositories/?limit=999&organization=1', 404);

      const { result, waitFor } = renderHook(
        () => useFileDepositories({ organization: '1' }),
        { wrapper: Wrapper },
      );

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/filedepositories/?limit=999&organization=1',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useFileDepository', () => {
    it('requests the resource', async () => {
      const fileDepository = fileDepositoryMockFactory();
      fetchMock.mock(
        `/api/filedepositories/${fileDepository.id}/`,
        fileDepository,
      );

      const { result, waitFor } = renderHook(
        () => useFileDepository(fileDepository.id),
        {
          wrapper: Wrapper,
        },
      );
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/filedepositories/${fileDepository.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(fileDepository);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource', async () => {
      const fileDepository = fileDepositoryMockFactory();
      fetchMock.mock(`/api/filedepositories/${fileDepository.id}/`, 404);

      const { result, waitFor } = renderHook(
        () => useFileDepository(fileDepository.id),
        {
          wrapper: Wrapper,
        },
      );

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/filedepositories/${fileDepository.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useCreateFileDepository', () => {
    it('creates the resource', async () => {
      const fileDepository = fileDepositoryMockFactory();
      fetchMock.post('/api/filedepositories/', fileDepository);

      const { result, waitFor } = renderHook(() => useCreateFileDepository(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        playlist: fileDepository.playlist.id,
        title: fileDepository.title!,
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/filedepositories/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          playlist: fileDepository.playlist.id,
          title: fileDepository.title,
        }),
      });
      expect(result.current.data).toEqual(fileDepository);
      expect(result.current.status).toEqual('success');
    });

    it('fails to create the resource', async () => {
      const fileDepository = fileDepositoryMockFactory();
      fetchMock.post('/api/filedepositories/', 400);

      const { result, waitFor } = renderHook(() => useCreateFileDepository(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        playlist: fileDepository.playlist.id,
        title: fileDepository.title!,
      });

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/filedepositories/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          playlist: fileDepository.playlist.id,
          title: fileDepository.title,
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useUpdateFileDepository', () => {
    it('updates the resource', async () => {
      const fileDepository = fileDepositoryMockFactory();
      fetchMock.patch(
        `/api/filedepositories/${fileDepository.id}/`,
        fileDepository,
      );

      const { result, waitFor } = renderHook(
        () => useUpdateFileDepository(fileDepository.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/filedepositories/${fileDepository.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          title: 'updated title',
        }),
      });
      expect(result.current.data).toEqual(fileDepository);
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const fileDepository = fileDepositoryMockFactory();
      fetchMock.patch(`/api/filedepositories/${fileDepository.id}/`, 400);

      const { result, waitFor } = renderHook(
        () => useUpdateFileDepository(fileDepository.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/filedepositories/${fileDepository.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          title: 'updated title',
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useDepositedFiles', () => {
    it('requests the first page of the resource list', async () => {
      const fileDepository = fileDepositoryMockFactory();
      const depositedFiles = Array(4).fill(
        depositedFileMockFactory({ file_depository: fileDepository }),
      );
      fetchMock.mock(
        `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=3`,
        depositedFiles.slice(0, 3),
      );

      const { result, waitFor } = renderHook(
        () => useDepositedFiles(fileDepository.id, { limit: 3 }),
        {
          wrapper: Wrapper,
        },
      );
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=3`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(depositedFiles.slice(0, 3));
      expect(result.current.status).toEqual('success');
    });

    it('requests the second page of the resource list', async () => {
      const fileDepository = fileDepositoryMockFactory();
      const depositedFiles = Array(4).fill(
        depositedFileMockFactory({ file_depository: fileDepository }),
      );
      fetchMock.mock(
        `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=3&offset=3`,
        depositedFiles.slice(3, 4),
      );

      const { result, waitFor } = renderHook(
        () => useDepositedFiles(fileDepository.id, { limit: 3, offset: 3 }),
        {
          wrapper: Wrapper,
        },
      );
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=3&offset=3`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(depositedFiles.slice(3, 4));
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource list', async () => {
      const fileDepository = fileDepositoryMockFactory();
      Array(4).fill(
        depositedFileMockFactory({ file_depository: fileDepository }),
      );
      fetchMock.mock(
        `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=3`,
        404,
      );

      const { result, waitFor } = renderHook(
        () => useDepositedFiles(fileDepository.id, { limit: 3 }),
        {
          wrapper: Wrapper,
        },
      );

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=3`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useUpdateDepositedFile', () => {
    it('updates the resource', async () => {
      const depositedFile = depositedFileMockFactory();
      fetchMock.patch(
        `/api/depositedfiles/${depositedFile.id}/`,
        depositedFile,
      );

      const { result, waitFor } = renderHook(
        () => useUpdateDepositedFile(depositedFile.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        read: true,
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/depositedfiles/${depositedFile.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          read: true,
        }),
      });
      expect(result.current.data).toEqual(depositedFile);
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const depositedFile = depositedFileMockFactory();
      fetchMock.patch(`/api/depositedfiles/${depositedFile.id}/`, 400);

      const { result, waitFor } = renderHook(
        () => useUpdateDepositedFile(depositedFile.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        read: true,
      });
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/depositedfiles/${depositedFile.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          read: true,
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });
});
