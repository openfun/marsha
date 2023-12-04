import fetchMock from 'fetch-mock';

import { addResource } from '@lib-components/data/stores/generics';
import { useJwt } from '@lib-components/hooks/stores/useJwt';
import { videoMockFactory } from '@lib-components/tests';
import { requestStatus } from '@lib-components/types/api';
import { modelName } from '@lib-components/types/models';
import { report } from '@lib-components/utils/errors/report';

import { getResource } from '.';

jest.mock('data/stores/generics', () => ({
  addResource: jest.fn(),
}));

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

const mockAddResource = addResource as jest.MockedFunction<typeof addResource>;

describe('sideEffects/getResource', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());
  afterEach(jest.resetAllMocks);

  it('requests the resource, handles the response and resolves with a success', async () => {
    const video = videoMockFactory({
      id: '022d356b-171e-4bd3-9ba8-26ce21be8647',
    });

    fetchMock.mock(
      `/api/videos/${video.id}/`,
      JSON.stringify({
        ...video,
        title: 'updated title',
      }),
    );

    const newVideo = await getResource(modelName.VIDEOS, video.id);

    expect(newVideo).toEqual({
      ...video,
      title: 'updated title',
    });
    expect(mockAddResource).toHaveBeenCalledWith(modelName.VIDEOS, newVideo);
  });

  it('resolves with a failure and handles it when it fails to get the resource (local)', async () => {
    const id = '9ab04b2c-96af-437e-809e-0eb7a965df4b';
    fetchMock.mock(
      `/api/videos/${id}/`,
      Promise.reject(new Error('Failed to perform the request')),
    );

    const status = await getResource(modelName.VIDEOS, id);

    expect(status).toEqual(requestStatus.FAILURE);
    expect(report).toHaveBeenCalledWith(
      new Error('Failed to perform the request'),
    );
    expect(mockAddResource).not.toHaveBeenCalled();
  });

  it('returns an error response when it fails to get the resource (api)', async () => {
    const id = '9ab04b2c-96af-437e-809e-0eb7a965df4c';
    fetchMock.mock(`/api/videos/${id}/`, 404);

    const status = await getResource(modelName.VIDEOS, id);

    expect(status).toEqual(requestStatus.FAILURE);
    expect(report).toHaveBeenCalledWith(
      new Error(`Failed to fetch resource videos with id ${id}`),
    );
    expect(mockAddResource).not.toHaveBeenCalled();
  });
});
