import { modelName } from '../../../types/models';
import { byId } from './resourceById';

describe('Reducer: resourceById()', () => {
  const video43 = {
    id: 43,
    title: 'Video 43',
  };

  const video44 = {
    id: 44,
    title: 'Video 44',
  };

  const video45 = {
    id: 45,
    title: 'Video 45',
  };

  it('returns an empty state for initialization', () => {
    expect(byId({ byId: {} }, { type: '' })).toEqual({
      byId: {},
    });
  });

  it('returns the state as is when called with an unknown action', () => {
    const previousState = {
      byId: { 43: video43 },
    };
    expect(byId(previousState, { type: '' })).toEqual(previousState);
  });

  describe('RESOURCE_ADD', () => {
    it('adds the resource to the state when called with RESOURCE', () => {
      const previousState = {
        byId: { 43: video43 },
      };
      expect(
        byId(previousState, {
          resource: video44,
          resourceName: modelName.VIDEOS,
          type: 'RESOURCE_ADD',
        }),
      ).toEqual({ byId: { 43: video43, 44: video44 } });
    });
  });

  describe('RESOURCE_DELETE', () => {
    it('replaces the record with undefined in the state', () => {
      const previousState = {
        byId: { 43: video43, 44: video44, 45: video45 },
      };
      expect(
        byId(previousState, {
          resource: video44,
          resourceName: modelName.VIDEOS,
          type: 'RESOURCE_DELETE',
        }),
      ).toEqual({ byId: { 43: video43, 45: video45 } });
    });
  });

  describe('RESOURCE_MULTIPLE_ADD', () => {
    it('adds several records at once', () => {
      const previousState = {
        byId: { 43: video43 },
      };
      expect(
        byId(previousState, {
          resourceName: modelName.VIDEOS,
          resources: [video44, video45],
          type: 'RESOURCE_MULTIPLE_ADD',
        }),
      ).toEqual({ byId: { 43: video43, 44: video44, 45: video45 } });
    });
  });
});
