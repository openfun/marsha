import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, WrapperComponent } from '@testing-library/react-hooks';

import { useJwt } from 'data/stores/useJwt';

import { classroomMockFactory } from 'apps/bbb/utils/tests/factories';

import {
  useClassroom,
  useClassrooms,
  useCreateClassroom,
  useUpdateClassroom,
  useCreateClassroomAction,
  useJoinClassroomAction,
} from '.';

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

let Wrapper: WrapperComponent<Element>;

describe('queries', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });

    const queryClient = new QueryClient({
      // tslint:disable-next-line:no-console
      logger: { log: console.log, warn: console.warn, error: () => {} },
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

  describe('useClassrooms', () => {
    it('requests the resource list', async () => {
      const classrooms = Array(4).fill(classroomMockFactory());
      fetchMock.mock('/api/classrooms/?organization=1&limit=999', classrooms);

      const { result, waitFor } = renderHook(
        () => useClassrooms({ organization: '1' }),
        {
          wrapper: Wrapper,
        },
      );
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/classrooms/?organization=1&limit=999',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(classrooms);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/classrooms/?organization=1&limit=999', 404);

      const { result, waitFor } = renderHook(
        () => useClassrooms({ organization: '1' }),
        { wrapper: Wrapper },
      );

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/classrooms/?organization=1&limit=999',
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

  describe('useClassroom', () => {
    it('requests the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.mock(`/api/classrooms/${classroom.id}/`, classroom);

      const { result, waitFor } = renderHook(() => useClassroom(classroom.id), {
        wrapper: Wrapper,
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(classroom);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.mock(`/api/classrooms/${classroom.id}/`, 404);

      const { result, waitFor } = renderHook(() => useClassroom(classroom.id), {
        wrapper: Wrapper,
      });

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/`,
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

  describe('useCreateClassroom', () => {
    it('creates the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.post('/api/classrooms/', classroom);

      const { result, waitFor } = renderHook(() => useCreateClassroom(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        playlist: classroom.playlist.id,
        title: classroom.title!,
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/classrooms/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          playlist: classroom.playlist.id,
          title: classroom.title,
        }),
      });
      expect(result.current.data).toEqual(classroom);
      expect(result.current.status).toEqual('success');
    });

    it('fails to create the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.post('/api/classrooms/', 400);

      const { result, waitFor } = renderHook(() => useCreateClassroom(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        playlist: classroom.playlist.id,
        title: classroom.title!,
      });

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/classrooms/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          playlist: classroom.playlist.id,
          title: classroom.title,
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useUpdateClassroom', () => {
    it('updates the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.patch(`/api/classrooms/${classroom.id}/`, classroom);

      const { result, waitFor } = renderHook(
        () => useUpdateClassroom(classroom.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/`,
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
      expect(result.current.data).toEqual(classroom);
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.patch(`/api/classrooms/${classroom.id}/`, 400);

      const { result, waitFor } = renderHook(
        () => useUpdateClassroom(classroom.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/`,
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

  describe('useCreateClassroomAction', () => {
    it('updates the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.patch(`/api/classrooms/${classroom.id}/create/`, classroom);

      const { result, waitFor } = renderHook(
        () => useCreateClassroomAction(classroom.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        welcome_text: 'Welcome text',
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/create/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          welcome_text: 'Welcome text',
        }),
      });
      expect(result.current.data).toEqual(classroom);
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.patch(`/api/classrooms/${classroom.id}/create/`, 400);

      const { result, waitFor } = renderHook(
        () => useCreateClassroomAction(classroom.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        welcome_text: 'Welcome text',
      });
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/create/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          welcome_text: 'Welcome text',
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useJoinClassroomAction', () => {
    it('updates the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.patch(`/api/classrooms/${classroom.id}/join/`, classroom);

      const { result, waitFor } = renderHook(
        () => useJoinClassroomAction(classroom.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        fullname: 'John Doe',
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/join/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          fullname: 'John Doe',
        }),
      });
      expect(result.current.data).toEqual(classroom);
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.patch(`/api/classrooms/${classroom.id}/join/`, 400);

      const { result, waitFor } = renderHook(
        () => useJoinClassroomAction(classroom.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        fullname: 'John Doe',
      });
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/join/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          fullname: 'John Doe',
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });
});
