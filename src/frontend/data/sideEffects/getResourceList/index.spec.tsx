import fetchMock from 'fetch-mock';

import { requestStatus } from '../../../types/api';
import { modelName } from '../../../types/models';
import { uploadState, Video } from '../../../types/tracks';
import { report } from '../../../utils/errors/report';
import { videoMockFactory } from '../../../utils/tests/factories';
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

jest.mock('../../../utils/errors/report', () => ({
  report: jest.fn(),
}));

const mockAddMultipleResources = addMultipleResources as jest.MockedFunction<
  typeof addMultipleResources
>;

describe('sideEffects/getResourceList', () => {
  const video42 = videoMockFactory({
    id: '42',
    is_ready_to_show: false,
    upload_state: uploadState.PENDING,
  });

  const video43 = videoMockFactory({
    id: '43',
    is_ready_to_show: true,
    upload_state: uploadState.READY,
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
        results: [video42, video43],
      }),
    );

    const status = await getResourceList(modelName.VIDEOS, {
      limit: 2,
      offset: 43,
    });

    expect(status).toEqual(requestStatus.SUCCESS);
    expect(mockAddMultipleResources).toHaveBeenCalledWith(modelName.VIDEOS, [
      videoMockFactory({
        id: '42',
        is_ready_to_show: false,
        upload_state: uploadState.PENDING,
      }),
      videoMockFactory({
        id: '43',
        is_ready_to_show: true,
        upload_state: uploadState.READY,
      }),
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
