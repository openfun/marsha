import fetchMock from 'fetch-mock';

import { requestStatus } from '../../../types/api';
import { modelName } from '../../../types/models';
import { uploadState, Video } from '../../../types/tracks';
import { getResourceList } from './';

jest.mock('../../appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

describe('sideEffects/getResourceList', () => {
  const dispatch = jest.fn();

  const video42 = {
    id: '42',
    is_ready_to_play: false,
    upload_state: uploadState.PENDING,
  } as Video;

  const video43 = {
    id: '43',
    is_ready_to_play: true,
    upload_state: uploadState.READY,
  } as Video;

  afterEach(fetchMock.restore);
  afterEach(jest.resetAllMocks);

  it('requests the resource list, handles the response and resolves with a success', async () => {
    fetchMock.mock(
      '/api/videos/?limit=2&offset=43',
      JSON.stringify([video42, video43]),
    );

    const status = await getResourceList(dispatch)(modelName.VIDEOS, {
      limit: 2,
      offset: 43,
    });

    expect(status).toEqual(requestStatus.SUCCESS);
    expect(dispatch).toHaveBeenCalledWith({
      params: { limit: 2, offset: 43 },
      resourceName: modelName.VIDEOS,
      type: 'RESOURCE_LIST_GET',
    });
    expect(dispatch).toHaveBeenCalledWith({
      apiResponse: { objects: [video42, video43] },
      params: { limit: 2, offset: 43 },
      resourceName: modelName.VIDEOS,
      type: 'RESOURCE_LIST_GET_SUCCESS',
    });
    expect(dispatch).toHaveBeenCalledWith({
      resourceName: modelName.VIDEOS,
      resources: [video42, video43],
      type: 'RESOURCE_MULTIPLE_ADD',
    });
  });

  it('resolves with a failure and handles it when it fails to get the resource list (local)', async () => {
    fetchMock.mock(
      '/api/videos/?limit=2&offset=43',
      Promise.reject(new Error('Failed to perform the request')),
    );

    const status = await getResourceList(dispatch)(modelName.VIDEOS, {
      limit: 2,
      offset: 43,
    });

    expect(status).toEqual(requestStatus.FAILURE);
    expect(dispatch).toHaveBeenCalledWith({
      params: { limit: 2, offset: 43 },
      resourceName: modelName.VIDEOS,
      type: 'RESOURCE_LIST_GET',
    });
    expect(dispatch).toHaveBeenCalledWith({
      error: new Error('Failed to perform the request'),
      resourceName: modelName.VIDEOS,
      type: 'RESOURCE_LIST_GET_FAILURE',
    });
  });

  it('returns an error response when it fails to get the resource list (api)', async () => {
    fetchMock.mock('/api/videos/?limit=2&offset=43', 404);

    const status = await getResourceList(dispatch)(modelName.VIDEOS, {
      limit: 2,
      offset: 43,
    });

    expect(status).toEqual(requestStatus.FAILURE);
    expect(dispatch).toHaveBeenCalledWith({
      params: { limit: 2, offset: 43 },
      resourceName: modelName.VIDEOS,
      type: 'RESOURCE_LIST_GET',
    });
    expect(dispatch).toHaveBeenCalledWith({
      error: new Error(
        'Failed to get list for /api/videos/ and {"limit":2,"offset":43} : 404.',
      ),
      resourceName: modelName.VIDEOS,
      type: 'RESOURCE_LIST_GET_FAILURE',
    });
  });
});
