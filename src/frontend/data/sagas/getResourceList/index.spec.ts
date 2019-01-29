import fetchMock from 'fetch-mock';
import { call, put } from 'redux-saga/effects';

import { requestStatus } from '../../../types/api';
import { modelName } from '../../../types/models';
import { uploadState, Video } from '../../../types/tracks';
import { addMultipleResources } from '../../genericReducers/resourceById/actions';
import {
  didGetResourceList,
  failedToGetResourceList,
} from '../../genericReducers/resourceList/actions';
import { fetchList, getList } from './';

// We'll be testing with a course-like Resource as the saga needs some specifics to operate: we want
// something simple but we don't want to rely on the specific implementation of a resource
describe('sideEffects/getResourceList saga', () => {
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

  describe('fetchList', () => {
    afterEach(fetchMock.restore);

    it('requests the resource list, parses the JSON response and resolves with the results', async () => {
      fetchMock.mock(
        '/api/videos/?limit=2&offset=43',
        JSON.stringify([video42, video43]),
      );

      const response = await fetchList('some token', modelName.VIDEOS, {
        limit: 2,
        offset: 43,
      });

      if (response.status !== requestStatus.SUCCESS) {
        return fail('response.status should have been SUCCESS.');
      }
      expect(response.objects).toEqual([video42, video43]);
    });

    it('returns an error response when it fails to get the resource list (local)', async () => {
      fetchMock.mock(
        '/api/videos/?limit=2&offset=43',
        Promise.reject(new Error('Failed to perform the request')),
      );

      const response = await fetchList('some token', modelName.VIDEOS, {
        limit: 2,
        offset: 43,
      });

      if (response.status !== requestStatus.FAILURE) {
        return fail('response.status should have been FAILURE.');
      }
      expect(response.error).toEqual(expect.any(Error));
    });

    it('returns an error response when it fails to get the resource list (api)', async () => {
      fetchMock.mock('/api/videos/?limit=2&offset=43', 404);

      const response = await fetchList('some token', modelName.VIDEOS, {
        limit: 2,
        offset: 43,
      });

      if (response.status !== requestStatus.FAILURE) {
        return fail('response.status should have been FAILURE.');
      }
      expect(response.error).toEqual(expect.any(Error));
    });
  });

  describe('getList', () => {
    const action = {
      jwt: 'some token',
      params: { limit: 10, offset: 0 },
      resourceName: modelName.VIDEOS,
      type: 'RESOURCE_LIST_GET' as 'RESOURCE_LIST_GET',
    };

    it('calls fetchList, puts each resource and yields a success action', () => {
      const gen = getList(action);
      const response = {
        objects: [video42, video43],
        status: requestStatus.SUCCESS,
      };

      // The call to fetch (the actual side-effect) is triggered
      expect(gen.next().value).toEqual(
        call(fetchList, 'some token', modelName.VIDEOS, action.params),
      );
      // Both videos are added to the state
      expect(gen.next(response).value).toEqual(
        put(addMultipleResources(modelName.VIDEOS, response.objects)),
      );
      // The success action is dispatched
      expect(gen.next().value).toEqual(
        put(
          didGetResourceList(modelName.VIDEOS, response.objects, action.params),
        ),
      );
    });

    it('yields a failure action when fetchList fails', () => {
      const gen = getList(action);
      const response = {
        error: new Error('Failed to fetch resources for some reason.'),
        status: requestStatus.FAILURE,
      };

      // The call to fetch is triggered, but fails for some reason
      expect(gen.next().value).toEqual(
        call(fetchList, 'some token', modelName.VIDEOS, action.params),
      );
      // The failure action is dispatched
      expect(gen.next(response).value).toEqual(
        put(failedToGetResourceList(modelName.VIDEOS, response.error)),
      );
    });
  });
});
