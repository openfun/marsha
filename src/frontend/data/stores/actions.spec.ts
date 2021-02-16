import { ModelName } from '../../types/models';
import { UploadState } from '../../types/tracks';
import { addMultipleResources, addResource, removeResource } from './actions';

describe('stores/actions', () => {
  describe('addMultipleResources', () => {
    it('adds multiple resources to an empty state', () => {
      const state = {};

      const newState = addMultipleResources(
        state as any,
        ModelName.THUMBNAILS,
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
        [ModelName.THUMBNAILS]: {
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
        [ModelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      };

      const newState = addMultipleResources(
        state as any,
        ModelName.THUMBNAILS,
        [
          {
            id: 'foo',
            upload_state: UploadState.PENDING,
          },
          {
            id: 'bar',
          },
        ],
      );

      expect(newState).toEqual({
        [ModelName.THUMBNAILS]: {
          bar: {
            id: 'bar',
          },
          foo: {
            id: 'foo',
            upload_state: UploadState.PENDING,
          },
        },
      });
    });
  });

  describe('addResource', () => {
    it('adds a new resource to an empty state', () => {
      const state = {};

      const newState = addResource(state as any, ModelName.THUMBNAILS, {
        id: 'foo',
      });

      expect(newState).toEqual({
        [ModelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      });
    });

    it('adds a new resource to an existing state', () => {
      const state = {
        [ModelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      };

      const newState = addResource(state as any, ModelName.THUMBNAILS, {
        id: 'bar',
      });

      expect(newState).toEqual({
        [ModelName.THUMBNAILS]: {
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
        [ModelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      };

      const newState = addResource(state as any, ModelName.THUMBNAILS, {
        id: 'foo',
        upload_state: UploadState.PENDING,
      });

      expect(newState).toEqual({
        [ModelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
            upload_state: UploadState.PENDING,
          },
        },
      });
    });
  });

  describe('removeResource', () => {
    it('removes an existing resource', () => {
      const state = {
        [ModelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      };

      const newState = removeResource(state as any, ModelName.THUMBNAILS, {
        id: 'foo',
      });

      expect(newState).toEqual({
        [ModelName.THUMBNAILS]: {},
      });
    });

    it('returns the same state when trying to remove a non existing resource', () => {
      const state = {
        [ModelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      };

      const newState = removeResource(state as any, ModelName.THUMBNAILS, {
        id: 'bar',
      });

      expect(newState).toEqual({
        [ModelName.THUMBNAILS]: {
          foo: {
            id: 'foo',
          },
        },
      });
    });
  });
});
