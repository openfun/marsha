import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt, videoMockFactory } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';
import { setLogger } from 'react-query';

import { useStopLiveRecording } from '.';

setLogger({
  log: console.log,
  warn: console.warn,
  // no more errors on the console
  error: () => {},
});

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('useStopLiveRecording', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('updates the resource', async () => {
    const video = videoMockFactory();
    fetchMock.patch(`/api/videos/${video.id}/stop-recording/`, video);

    const onError = jest.fn();
    const { result } = renderHook(
      () => useStopLiveRecording(video.id, onError),
      {
        wrapper: WrapperReactQuery,
      },
    );
    result.current.mutate();
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/stop-recording/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    });
    expect(result.current.data).toEqual(video);
    expect(result.current.status).toEqual('success');

    expect(onError).not.toHaveBeenCalled();
  });

  it('fails to update the resource', async () => {
    const video = videoMockFactory();
    fetchMock.patch(`/api/videos/${video.id}/stop-recording/`, 400);

    const onError = jest.fn();
    const { result } = renderHook(
      () => useStopLiveRecording(video.id, onError),
      {
        wrapper: WrapperReactQuery,
      },
    );
    result.current.mutate();
    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/stop-recording/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');

    expect(onError).toHaveBeenCalled();
  });
});
