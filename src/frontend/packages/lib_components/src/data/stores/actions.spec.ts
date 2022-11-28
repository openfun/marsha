import { modelName } from '../../types/models';
import { uploadState } from '../../types/tracks';

import { addMultipleResources, addResource, removeResource } from './actions';

describe('stores/actions', () => {
  describe('addMultipleResources', () => {
    it('adds multiple resources to an empty state', () => {
      const state = {};

      const newState = addMultipleResources(
        state as any,
        modelName.THUMBNAILS,
        [
          {
            id: 'foo',
          },
          {
            id: 'bar',
          },
        ],
      );

      expect(newState).toEqual({
        [modelName.THUMBNAILS]: {
          bar: {
            id: 'bar',
          },
          foo: {
            id: 'foo',
          },
        },
      });
    });

    it('adds multiple resources to an existing state', () => {
      const state = {
        [modelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      };

      const newState = addMultipleResources(
        state as any,
        modelName.THUMBNAILS,
        [
          {
            id: 'foo',
            upload_state: uploadState.PENDING,
          },
          {
            id: 'bar',
          },
        ],
      );

      expect(newState).toEqual({
        [modelName.THUMBNAILS]: {
          bar: {
            id: 'bar',
          },
          foo: {
            id: 'foo',
            upload_state: uploadState.PENDING,
          },
        },
      });
    });
  });

  describe('addResource', () => {
    it('adds a new resource to an empty state', () => {
      const state = {};

      const newState = addResource(state as any, modelName.THUMBNAILS, {
        id: 'foo',
      });

      expect(newState).toEqual({
        [modelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      });
    });

    it('adds a new resource to an existing state', () => {
      const state = {
        [modelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      };

      const newState = addResource(state as any, modelName.THUMBNAILS, {
        id: 'bar',
      });

      expect(newState).toEqual({
        [modelName.THUMBNAILS]: {
          bar: {
            id: 'bar',
          },
          foo: {
            id: 'foo',
          },
        },
      });
    });

    it('replaces an existing resource if same id already exists', () => {
      const state = {
        [modelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      };

      const newState = addResource(state as any, modelName.THUMBNAILS, {
        id: 'foo',
        upload_state: uploadState.PENDING,
      });

      expect(newState).toEqual({
        [modelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
            upload_state: uploadState.PENDING,
          },
        },
      });
    });
  });

  describe('removeResource', () => {
    it('removes an existing resource', () => {
      const state = {
        [modelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      };

      const newState = removeResource(state as any, modelName.THUMBNAILS, {
        id: 'foo',
      });

      expect(newState).toEqual({
        [modelName.THUMBNAILS]: {},
      });
    });

    it('returns the same state when trying to remove a non existing resource', () => {
      const state = {
        [modelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      };

      const newState = removeResource(state as any, modelName.THUMBNAILS, {
        id: 'bar',
      });

      expect(newState).toEqual({
        [modelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      });
    });
  });
});
