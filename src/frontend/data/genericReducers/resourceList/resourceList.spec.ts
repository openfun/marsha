import { requestStatus } from '../../../types/api';
import { modelName } from '../../../types/models';
import { currentQuery } from './resourceList';

describe('Reducer: resourceList()', () => {
  describe('RESOURCE_LIST_GET', () => {
    it('creates the query and marks it as pending', () => {
      // From an empty state
      expect(
        currentQuery(
          {},
          {
            jwt: 'some token',
            params: {},
            resourceName: modelName.TIMEDTEXTTRACKS,
            type: 'RESOURCE_LIST_GET',
          },
        ),
      ).toEqual({
        currentQuery: {
          items: {},
          params: {
            limit: 20,
            offset: 0,
          },
          status: requestStatus.PENDING,
        },
      });

      // From an existing state
      expect(
        currentQuery(
          {
            currentQuery: {
              items: { 42: 'some item' },
              params: {
                limit: 5,
                offset: 5,
              },
              status: requestStatus.FAILURE,
            },
          },
          {
            jwt: 'some token',
            params: {},
            resourceName: modelName.TIMEDTEXTTRACKS,
            type: 'RESOURCE_LIST_GET',
          },
        ),
      ).toEqual({
        currentQuery: {
          items: {},
          params: {
            limit: 20,
            offset: 0,
          },
          status: requestStatus.PENDING,
        },
      });
    });
  });

  describe('RESOURCE_LIST_GET_FAILURE', () => {
    it('marks the query as a failure and erases any items', () => {
      expect(
        currentQuery(
          {
            currentQuery: {
              items: { 42: 'some item' },
              params: {
                limit: 20,
                offset: 0,
              },
              status: requestStatus.PENDING,
            },
          },
          {
            error: 'some error',
            resourceName: modelName.TIMEDTEXTTRACKS,
            type: 'RESOURCE_LIST_GET_FAILURE',
          },
        ),
      ).toEqual({
        currentQuery: {
          items: {},
          params: {
            limit: 20,
            offset: 0,
          },
          status: requestStatus.FAILURE,
        },
      });
    });
  });

  describe('RESOURCE_LIST_GET_SUCCESS', () => {
    it('replaces the existing query with one built from the action', () => {
      expect(
        currentQuery(
          {
            currentQuery: {
              items: {},
              params: {
                limit: 20,
                offset: 0,
              },
              status: requestStatus.PENDING,
            },
          },
          {
            apiResponse: { objects: [{ id: '42' }, { id: '43' }] },
            params: {},
            resourceName: modelName.VIDEOS,
            type: 'RESOURCE_LIST_GET_SUCCESS',
          },
        ),
      ).toEqual({
        currentQuery: {
          items: { 0: '42', 1: '43' },
          params: { limit: 20, offset: 0 },
          status: 'success',
        },
      });
    });
  });
});
