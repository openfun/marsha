import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';

import { pollForTrack } from '.';
import { RequestStatus } from '../../../types/api';
import { ModelName } from '../../../types/models';
import { report } from '../../../utils/errors/report';

jest.mock('../../../utils/errors/report', () => ({ report: jest.fn() }));
jest.mock('../../appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

describe('sideEffects/pollForTrack', () => {
  jest.useFakeTimers();

  afterEach(() => fetchMock.restore());

  it('polls the track, backing off until it is ready and resolves with a success', async () => {
    fetchMock.mock(
      '/api/videos/42/',
      JSON.stringify({ is_ready_to_show: false }),
      { method: 'GET' },
    );
    const promise = pollForTrack(ModelName.VIDEOS, '42', 15);

    expect(
      fetchMock.calls('/api/videos/42/', { method: 'GET' }).length,
    ).toEqual(1);

    jest.advanceTimersByTime(2 * 15 * 1000 + 200);

    await waitFor(() => {
      expect(
        fetchMock.calls('/api/videos/42/', { method: 'GET' }).length,
      ).toEqual(2);
    });

    jest.advanceTimersByTime(2 * 3 * 15 * 1000 + 200);

    await waitFor(() => {
      expect(
        fetchMock.calls('/api/videos/42/', { method: 'GET' }).length,
      ).toEqual(3);
    });

    fetchMock.mock(
      '/api/videos/42/',
      JSON.stringify({ is_ready_to_show: true }),
      { method: 'GET', overwriteRoutes: true },
    );

    jest.advanceTimersByTime(2 * 3 * 4 * 15 * 1000 + 200);

    await waitFor(() => {
      expect(
        fetchMock.calls('/api/videos/42/', { method: 'GET' }).length,
      ).toEqual(4);
    });

    expect(await promise).toEqual(RequestStatus.SUCCESS);

    jest.advanceTimersByTime(2 * 3 * 4 * 5 * 15 * 1000 + 200);

    await waitFor(() => {
      // No new calls have been issued
      expect(
        fetchMock.calls('/api/videos/42/', { method: 'GET' }).length,
      ).toEqual(4);
    });
  });

  it('polls a document, backing off until it is ready and resolves with a success', async () => {
    fetchMock.mock(
      '/api/documents/42/',
      JSON.stringify({ is_ready_to_show: false }),
      { method: 'GET' },
    );
    const promise = pollForTrack(ModelName.DOCUMENTS, '42', 15);

    expect(
      fetchMock.calls('/api/documents/42/', { method: 'GET' }).length,
    ).toEqual(1);

    jest.advanceTimersByTime(2 * 15 * 1000 + 200);

    await waitFor(() => {
      expect(
        fetchMock.calls('/api/documents/42/', { method: 'GET' }).length,
      ).toEqual(2);
    });

    jest.advanceTimersByTime(2 * 3 * 15 * 1000 + 200);

    await waitFor(() => {
      expect(
        fetchMock.calls('/api/documents/42/', { method: 'GET' }).length,
      ).toEqual(3);
    });

    fetchMock.mock(
      '/api/documents/42/',
      JSON.stringify({ is_ready_to_show: true }),
      { method: 'GET', overwriteRoutes: true },
    );

    jest.advanceTimersByTime(2 * 3 * 4 * 15 * 1000 + 200);

    await waitFor(() => {
      expect(
        fetchMock.calls('/api/documents/42/', { method: 'GET' }).length,
      ).toEqual(4);
    });

    expect(await promise).toEqual(RequestStatus.SUCCESS);

    jest.advanceTimersByTime(2 * 3 * 4 * 5 * 15 * 1000 + 200);

    // No new calls have been issued
    await waitFor(() => {
      expect(
        fetchMock.calls('/api/documents/42/', { method: 'GET' }).length,
      ).toEqual(4);
    });
  });

  it('resolves with a failure and reports it when it fails to poll the track', async () => {
    fetchMock.mock(
      '/api/videos/42/',
      JSON.stringify({ is_ready_to_show: false }),
      { method: 'GET' },
    );
    const promise = pollForTrack(ModelName.VIDEOS, '42', 15);

    // The first call was successful
    expect(
      fetchMock.calls('/api/videos/42/', { method: 'GET' }).length,
    ).toEqual(1);

    fetchMock.mock(
      '/api/videos/42/',
      { throws: new Error('Failed to get the track') },
      {
        method: 'GET',
        overwriteRoutes: true,
      },
    );

    jest.advanceTimersByTime(2 * 15 * 1000 + 200);

    await waitFor(() => {
      expect(
        fetchMock.calls('/api/videos/42/', { method: 'GET' }).length,
      ).toEqual(2);
    });
    expect(await promise).toEqual(RequestStatus.FAILURE);
    expect(report).toHaveBeenCalledWith(new Error('Failed to get the track'));
  });
});
