import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  addResource,
  modelName,
  report,
  requestStatus,
  useJwt,
} from 'lib-components';
import {
  documentMockFactory,
  timedTextMockFactory,
} from 'lib-components/tests';

import { pollForTrack } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
  addResource: jest.fn(),
}));

describe('sideEffects/pollForTrack', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
    jest.clearAllMocks();
  });

  afterEach(() => {
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
      0.2,
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

    const track = timedTextMockFactory({
      id: 'c43f0c8f-4d3b-4219-86c3-86367b2b88cc',
      is_ready_to_show: true,
    });
    fetchMock.mock(
      '/api/timedtexttracks/c43f0c8f-4d3b-4219-86c3-86367b2b88cc/',
      JSON.stringify(track),
      {
        method: 'GET',
        overwriteRoutes: true,
      },
    );

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
    expect(addResource).toHaveBeenCalledWith('timedtexttracks', track);
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
      0.2,
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
      Promise.reject(new Error('Failed to get the track')),
      {
        method: 'GET',
        overwriteRoutes: true,
      },
    );

    const promise = pollForTrack(
      modelName.VIDEOS,
      '15cf570a-5dc6-421a-9856-59e1b008a6fb',
      0.2,
    );

    await waitFor(() => {
      expect(
        fetchMock.calls('/api/videos/15cf570a-5dc6-421a-9856-59e1b008a6fb/', {
          method: 'GET',
        }),
      ).toHaveLength(1);
    });

    expect(await promise).toEqual(requestStatus.FAILURE);
    expect(report).toHaveBeenCalledWith(Error('Failed to get the track'));
  });
});
