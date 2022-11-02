import fetchMock from 'fetch-mock';
import { useJwt, videoMockFactory } from 'lib-components';

import { addMultipleResources } from 'lib-components';
import { requestStatus } from 'lib-components';
import { modelName } from 'lib-components';
import { uploadState } from 'lib-components';
import { report } from 'lib-components';

import { getResourceList } from './';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  addMultipleResources: jest.fn(),
  report: jest.fn(),
}));

const mockAddMultipleResources = addMultipleResources as jest.MockedFunction<
  typeof addMultipleResources
>;

describe('sideEffects/getResourceList', () => {
  const videoPending = videoMockFactory({
    is_ready_to_show: false,
    upload_state: uploadState.PENDING,
  });

  const videoReady = videoMockFactory({
    is_ready_to_show: true,
    upload_state: uploadState.READY,
  });

  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });
  });

  afterEach(() => fetchMock.restore());
  afterEach(jest.resetAllMocks);

  it('requests the resource list, handles the response and resolves with a success', async () => {
    fetchMock.mock(
      '/api/videos/?limit=2&offset=43',
      JSON.stringify({
        count: 2,
        next: null,
        previous: null,
        results: [videoPending, videoReady],
      }),
    );

    const status = await getResourceList(modelName.VIDEOS, {
      limit: 2,
      offset: 43,
    });

    expect(status).toEqual(requestStatus.SUCCESS);
    expect(mockAddMultipleResources).toHaveBeenCalledWith(modelName.VIDEOS, [
      videoPending,
      videoReady,
    ]);
  });

  it('resolves with a failure and handles it when it fails to get the resource list (local)', async () => {
    fetchMock.mock(
      '/api/videos/?limit=2&offset=43',
      Promise.reject(new Error('Failed to perform the request')),
    );

    const status = await getResourceList(modelName.VIDEOS, {
      limit: 2,
      offset: 43,
    });

    expect(status).toEqual(requestStatus.FAILURE);
    expect(report).toHaveBeenCalledWith(
      new Error('Failed to perform the request'),
    );
    expect(mockAddMultipleResources).not.toHaveBeenCalled();
  });

  it('returns an error response when it fails to get the resource list (api)', async () => {
    fetchMock.mock('/api/videos/?limit=2&offset=43', 404);

    const status = await getResourceList(modelName.VIDEOS, {
      limit: 2,
      offset: 43,
    });

    expect(status).toEqual(requestStatus.FAILURE);
    expect(report).toHaveBeenCalledWith(
      new Error(
        'Failed to get list for /api/videos/ and {"limit":2,"offset":43} : 404.',
      ),
    );
    expect(mockAddMultipleResources).not.toHaveBeenCalled();
  });
});
