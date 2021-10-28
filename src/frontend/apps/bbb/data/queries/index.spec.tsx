import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';
import { renderHook, WrapperComponent } from '@testing-library/react-hooks';

import {
  useMeeting,
  useMeetings,
  useUpdateMeeting,
  useCreateMeeting,
  useJoinMeeting,
} from './index';
import { meetingMockFactory } from '../../utils/tests/factories';

setLogger({
  // tslint:disable-next-line:no-console
  log: console.log,
  warn: console.warn,
  // no more errors on the console
  error: () => {},
});

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

let Wrapper: WrapperComponent<Element>;

describe('queries', () => {
  beforeEach(() => {
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

  describe('useMeetings', () => {
    it('requests the resource list', async () => {
      const meetings = Array(4).fill(meetingMockFactory());
      fetchMock.mock('/api/meetings/?organization=1&limit=999', meetings);

      const { result, waitFor } = renderHook(
        () => useMeetings({ organization: '1' }),
        {
          wrapper: Wrapper,
        },
      );
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/meetings/?organization=1&limit=999',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(meetings);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/meetings/?organization=1&limit=999', 404);

      const { result, waitFor } = renderHook(
        () => useMeetings({ organization: '1' }),
        { wrapper: Wrapper },
      );

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/meetings/?organization=1&limit=999',
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

  describe('useMeeting', () => {
    it('requests the resource', async () => {
      const meeting = meetingMockFactory();
      fetchMock.mock(`/api/meetings/${meeting.id}/`, meeting);

      const { result, waitFor } = renderHook(() => useMeeting(meeting.id), {
        wrapper: Wrapper,
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/meetings/${meeting.id}/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(meeting);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource', async () => {
      const meeting = meetingMockFactory();
      fetchMock.mock(`/api/meetings/${meeting.id}/`, 404);

      const { result, waitFor } = renderHook(() => useMeeting(meeting.id), {
        wrapper: Wrapper,
      });

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/meetings/${meeting.id}/`);
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

  describe('useUpdateMeeting', () => {
    it('updates the resource', async () => {
      const meeting = meetingMockFactory();
      fetchMock.patch(`/api/meetings/${meeting.id}/`, meeting);

      const { result, waitFor } = renderHook(
        () => useUpdateMeeting(meeting.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/meetings/${meeting.id}/`);
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
      expect(result.current.data).toEqual(meeting);
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const meeting = meetingMockFactory();
      fetchMock.patch(`/api/meetings/${meeting.id}/`, 400);

      const { result, waitFor } = renderHook(
        () => useUpdateMeeting(meeting.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/meetings/${meeting.id}/`);
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

  describe('useCreateMeeting', () => {
    it('updates the resource', async () => {
      const meeting = meetingMockFactory();
      fetchMock.patch(`/api/meetings/${meeting.id}/bbb_create/`, meeting);

      const { result, waitFor } = renderHook(
        () => useCreateMeeting(meeting.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        welcome_text: 'Welcome text',
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/meetings/${meeting.id}/bbb_create/`,
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
      expect(result.current.data).toEqual(meeting);
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const meeting = meetingMockFactory();
      fetchMock.patch(`/api/meetings/${meeting.id}/bbb_create/`, 400);

      const { result, waitFor } = renderHook(
        () => useCreateMeeting(meeting.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        welcome_text: 'Welcome text',
      });
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/meetings/${meeting.id}/bbb_create/`,
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

  describe('useJoinMeeting', () => {
    it('updates the resource', async () => {
      const meeting = meetingMockFactory();
      fetchMock.patch(`/api/meetings/${meeting.id}/bbb_join/`, meeting);

      const { result, waitFor } = renderHook(() => useJoinMeeting(meeting.id), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        fullname: 'John Doe',
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/meetings/${meeting.id}/bbb_join/`,
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
      expect(result.current.data).toEqual(meeting);
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const meeting = meetingMockFactory();
      fetchMock.patch(`/api/meetings/${meeting.id}/bbb_join/`, 400);

      const { result, waitFor } = renderHook(() => useJoinMeeting(meeting.id), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        fullname: 'John Doe',
      });
      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/meetings/${meeting.id}/bbb_join/`,
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
