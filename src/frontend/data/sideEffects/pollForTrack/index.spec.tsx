import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';

import { pollForTrack } from '.';
import { requestStatus } from '../../../types/api';
import { modelName } from '../../../types/models';
import { report } from '../../../utils/errors/report';
import {
  documentMockFactory,
  timedTextMockFactory,
  videoMockFactory,
} from '../../../utils/tests/factories';

jest.mock('../../../utils/errors/report', () => ({ report: jest.fn() }));
jest.mock('../../appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

describe('sideEffects/pollForTrack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers('modern');
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    fetchMock.restore();
  });

  it('polls the track, backing off until it is ready and resolves with a success', async () => {
    fetchMock.mock(
      '/api/timedtexttracks/c43f0c8f-4d3b-4219-86c3-86367b2b88cc/',
      JSON.stringify(
        timedTextMockFactory({
          id: 'c43f0c8f-4d3b-4219-86c3-86367b2b88cc',
          is_ready_to_show: false,
        }),
      ),
      { method: 'GET' },
    );

    const promise = pollForTrack(
      modelName.TIMEDTEXTTRACKS,
      'c43f0c8f-4d3b-4219-86c3-86367b2b88cc',
    );

    await waitFor(() => {
      expect(
        fetchMock.calls(
          '/api/timedtexttracks/c43f0c8f-4d3b-4219-86c3-86367b2b88cc/',
          {
            method: 'GET',
          },
        ),
      ).toHaveLength(1);
    });

    fetchMock.mock(
      '/api/timedtexttracks/c43f0c8f-4d3b-4219-86c3-86367b2b88cc/',
      JSON.stringify(
        timedTextMockFactory({
          id: 'c43f0c8f-4d3b-4219-86c3-86367b2b88cc',
          is_ready_to_show: true,
        }),
      ),
      {
        method: 'GET',
        overwriteRoutes: true,
      },
    );

    jest.runOnlyPendingTimers();

    await waitFor(() => {
      expect(
        fetchMock.calls(
          '/api/timedtexttracks/c43f0c8f-4d3b-4219-86c3-86367b2b88cc/',
          {
            method: 'GET',
          },
        ),
      ).toHaveLength(2);
    });

    expect(await promise).toEqual(requestStatus.SUCCESS);
  });

  it('polls a document, backing off until it is ready and resolves with a success', async () => {
    fetchMock.mock(
      '/api/documents/5704165a-89ee-4378-a2ee-85b8f643ad07/',
      JSON.stringify(
        documentMockFactory({
          id: 'c43f0c8f-4d3b-4219-86c3-86367b2b88cc',
          is_ready_to_show: false,
        }),
      ),
      { method: 'GET' },
    );

    const promise = pollForTrack(
      modelName.DOCUMENTS,
      '5704165a-89ee-4378-a2ee-85b8f643ad07',
    );

    await waitFor(() => {
      expect(
        fetchMock.calls(
          '/api/documents/5704165a-89ee-4378-a2ee-85b8f643ad07/',
          {
            method: 'GET',
          },
        ),
      ).toHaveLength(1);
    });

    fetchMock.mock(
      '/api/documents/5704165a-89ee-4378-a2ee-85b8f643ad07/',
      JSON.stringify(
        documentMockFactory({
          id: '5704165a-89ee-4378-a2ee-85b8f643ad07',
          is_ready_to_show: true,
        }),
      ),
      {
        method: 'GET',
        overwriteRoutes: true,
      },
    );

    jest.runOnlyPendingTimers();

    await waitFor(() => {
      expect(
        fetchMock.calls(
          '/api/documents/5704165a-89ee-4378-a2ee-85b8f643ad07/',
          {
            method: 'GET',
          },
        ),
      ).toHaveLength(2);
    });

    expect(await promise).toEqual(requestStatus.SUCCESS);
  });

  it('resolves with a failure and reports it when it fails to poll the track', async () => {
    fetchMock.mock(
      '/api/videos/15cf570a-5dc6-421a-9856-59e1b008a6fb/',
      JSON.stringify(
        videoMockFactory({
          id: 'c43f0c8f-4d3b-4219-86c3-86367b2b88cc',
          is_ready_to_show: false,
        }),
      ),
      { method: 'GET' },
    );

    const promise = pollForTrack(
      modelName.VIDEOS,
      '15cf570a-5dc6-421a-9856-59e1b008a6fb',
    );

    await waitFor(() => {
      expect(
        fetchMock.calls('/api/videos/15cf570a-5dc6-421a-9856-59e1b008a6fb/', {
          method: 'GET',
        }),
      ).toHaveLength(1);
    });

    fetchMock.mock(
      '/api/videos/15cf570a-5dc6-421a-9856-59e1b008a6fb/',
      Promise.reject(new Error('Failed to get the track')),
      {
        method: 'GET',
        overwriteRoutes: true,
      },
    );

    jest.runOnlyPendingTimers();

    expect(await promise).toEqual(requestStatus.FAILURE);
    expect(report).toHaveBeenCalledWith(Error('Failed to get the track'));
  });
});
