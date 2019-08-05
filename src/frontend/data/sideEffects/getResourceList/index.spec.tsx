import fetchMock from 'fetch-mock';

import { requestStatus } from '../../../types/api';
import { modelName } from '../../../types/models';
import { uploadState, Video } from '../../../types/tracks';
import { jestMockOf } from '../../../utils/types';
import { addMultipleResources } from '../../stores/generics';
import { getResourceList } from './';

jest.mock('../../appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

jest.mock('../../stores/generics', () => ({
  addMultipleResources: jest.fn(),
}));

const mockAddMultipleResources = addMultipleResources as jestMockOf<
  typeof addMultipleResources
>;

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

    const status = await getResourceList(modelName.VIDEOS, {
      limit: 2,
      offset: 43,
    });

    expect(status).toEqual(requestStatus.SUCCESS);
    expect(mockAddMultipleResources).toHaveBeenCalledWith(modelName.VIDEOS, [
      {
        id: '42',
        is_ready_to_play: false,
        upload_state: uploadState.PENDING,
      },
      {
        id: '43',
        is_ready_to_play: true,
        upload_state: uploadState.READY,
      },
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
    expect(mockAddMultipleResources).not.toHaveBeenCalled();
  });

  it('returns an error response when it fails to get the resource list (api)', async () => {
    fetchMock.mock('/api/videos/?limit=2&offset=43', 404);

    const status = await getResourceList(modelName.VIDEOS, {
      limit: 2,
      offset: 43,
    });

    expect(status).toEqual(requestStatus.FAILURE);
    expect(mockAddMultipleResources).not.toHaveBeenCalled();
  });
});
