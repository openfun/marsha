import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';

import {
  classroomDocumentMockFactory,
  classroomMockFactory,
} from '@lib-classroom/tests/factories';

import {
  useClassroom,
  useClassroomDocuments,
  useClassrooms,
  useCreateClassroom,
  useCreateClassroomAction,
  useDeleteClassroom,
  useDeleteClassrooms,
  useJoinClassroomAction,
  useUpdateClassroom,
  useUpdateClassroomDocument,
} from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('queries', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  describe('useClassrooms', () => {
    it('requests the resource list', async () => {
      const classrooms = Array(4).fill(classroomMockFactory());
      fetchMock.mock('/api/classrooms/?limit=999&organization=1', classrooms);

      const { result } = renderHook(
        () => useClassrooms({ organization: '1' }),
        {
          wrapper: WrapperReactQuery,
        },
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/classrooms/?limit=999&organization=1',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
      });
      expect(result.current.data).toEqual(classrooms);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/classrooms/?limit=999&organization=1', 404);

      const { result } = renderHook(
        () => useClassrooms({ organization: '1' }),
        { wrapper: WrapperReactQuery },
      );

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/classrooms/?limit=999&organization=1',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(() => useClassroom(classroom.id), {
        wrapper: WrapperReactQuery,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
      });
      expect(result.current.data).toEqual(classroom);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.mock(`/api/classrooms/${classroom.id}/`, 404);

      const { result } = renderHook(() => useClassroom(classroom.id), {
        wrapper: WrapperReactQuery,
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(() => useCreateClassroom(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        playlist: classroom.playlist.id,
        title: classroom.title!,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/classrooms/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(() => useCreateClassroom(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        playlist: classroom.playlist.id,
        title: classroom.title!,
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/classrooms/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

  describe('useDeleteClassroom', () => {
    it('deletes the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.delete(`/api/classrooms/${classroom.id}/`, 204);

      const { result } = renderHook(() => useDeleteClassroom(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate(classroom.id);
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
        method: 'DELETE',
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('success');
    });

    it('fails to delete the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.delete(`/api/classrooms/${classroom.id}/`, 400);

      const { result } = renderHook(() => useDeleteClassroom(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate(classroom.id);

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
        method: 'DELETE',
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useUpdateClassroom', () => {
    it('updates the resource', async () => {
      const classroom = classroomMockFactory();
      fetchMock.patch(`/api/classrooms/${classroom.id}/`, classroom);

      const { result } = renderHook(() => useUpdateClassroom(classroom.id), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(() => useUpdateClassroom(classroom.id), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(
        () => useCreateClassroomAction(classroom.id),
        {
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({
        welcome_text: 'Welcome text',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/create/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(
        () => useCreateClassroomAction(classroom.id),
        {
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({
        welcome_text: 'Welcome text',
      });
      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/create/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Accept-Language': 'en',
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

      const { result } = renderHook(
        () => useJoinClassroomAction(classroom.id),
        {
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({
        fullname: 'John Doe',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/join/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Accept-Language': 'en',
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

      const { result } = renderHook(
        () => useJoinClassroomAction(classroom.id),
        {
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({
        fullname: 'John Doe',
      });
      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/join/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Accept-Language': 'en',
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

  describe('useClassroomDocuments', () => {
    it('requests the resource list', async () => {
      const classroom = classroomMockFactory();
      const classroomDocuments = Array(4).fill(
        classroomDocumentMockFactory({ classroom_id: classroom.id }),
      );
      fetchMock.mock(
        `/api/classrooms/${classroom.id}/classroomdocuments/?limit=999`,
        classroomDocuments,
      );

      const { result } = renderHook(
        () => useClassroomDocuments(classroom.id, {}),
        {
          wrapper: WrapperReactQuery,
        },
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/classroomdocuments/?limit=999`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Accept-Language': 'en',
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(classroomDocuments);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource list', async () => {
      const classroom = classroomMockFactory();
      Array(4).fill(
        classroomDocumentMockFactory({ classroom_id: classroom.id }),
      );
      fetchMock.mock(
        `/api/classrooms/${classroom.id}/classroomdocuments/?limit=999`,
        404,
      );

      const { result } = renderHook(
        () => useClassroomDocuments(classroom.id, {}),
        {
          wrapper: WrapperReactQuery,
        },
      );

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroom.id}/classroomdocuments/?limit=999`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Accept-Language': 'en',
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useUpdateClassroomDocument', () => {
    it('updates the resource', async () => {
      const classroomDocument = classroomDocumentMockFactory();
      fetchMock.patch(
        `/api/classrooms/${classroomDocument.classroom_id}/classroomdocuments/${classroomDocument.id}/`,
        classroomDocument,
      );

      const { result } = renderHook(
        () =>
          useUpdateClassroomDocument(
            classroomDocument.classroom_id,
            classroomDocument.id,
          ),
        {
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({
        is_default: true,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroomDocument.classroom_id}/classroomdocuments/${classroomDocument.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Accept-Language': 'en',
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          is_default: true,
        }),
      });
      expect(result.current.data).toEqual(classroomDocument);
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const classroomDocument = classroomDocumentMockFactory();
      fetchMock.patch(
        `/api/classrooms/${classroomDocument.classroom_id}/classroomdocuments/${classroomDocument.id}/`,
        400,
      );

      const { result } = renderHook(
        () =>
          useUpdateClassroomDocument(
            classroomDocument.classroom_id,
            classroomDocument.id,
          ),
        {
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({
        is_default: true,
      });
      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/classrooms/${classroomDocument.classroom_id}/classroomdocuments/${classroomDocument.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Accept-Language': 'en',
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          is_default: true,
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });
});

describe('useDeleteClassrooms', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('deletes multiples resources', async () => {
    const classroom1 = classroomMockFactory();
    const classroom2 = classroomMockFactory();

    fetchMock.delete('/api/classrooms/', {
      status: 204,
      body: { ids: [classroom1.id, classroom2.id] },
    });
    const { result } = renderHook(() => useDeleteClassrooms(), {
      wrapper: WrapperReactQuery,
    });
    result.current.mutate({ ids: [classroom1.id, classroom2.id] });
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(`/api/classrooms/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Accept-Language': 'en',
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      body: `{"ids":["${classroom1.id}","${classroom2.id}"]}`,
      method: 'DELETE',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('success');
  });

  it('fails to delete the resources', async () => {
    const classroom = classroomMockFactory();
    fetchMock.delete('/api/classrooms/', {
      status: 400,
    });

    const { result } = renderHook(() => useDeleteClassrooms(), {
      wrapper: WrapperReactQuery,
    });
    result.current.mutate({ ids: [classroom.id] });

    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(`/api/classrooms/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Accept-Language': 'en',
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      body: `{"ids":["${classroom.id}"]}`,
      method: 'DELETE',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});
