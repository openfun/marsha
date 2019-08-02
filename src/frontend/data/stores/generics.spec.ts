import { modelName } from '../../types/models';
import { addMultipleResources, addResource, getResource } from './generics';
import { useThumbnailApi } from './useThumbnail';
import { useTimedTextTrackApi } from './useTimedTextTrack';
import { useVideoApi } from './useVideo';

describe('stores/generics', () => {
  afterEach(() => {
    // restore the state of each store.
    useVideoApi.setState({
      [modelName.VIDEOS]: {},
    });
    useThumbnailApi.setState({
      [modelName.THUMBNAIL]: {},
    });
    useTimedTextTrackApi.setState({
      [modelName.TIMEDTEXTTRACKS]: {},
    });
  });
  describe('addResource', () => {
    it('adds a thumbnail resource', () => {
      addResource(modelName.THUMBNAIL, { id: 'thumbnail' } as any);

      const state = useThumbnailApi.getState();
      expect(state[modelName.THUMBNAIL].thumbnail).toEqual({ id: 'thumbnail'});
    });
    it('adds a timed text track resource', () => {
      addResource(modelName.TIMEDTEXTTRACKS, { id: 'timedTextTrack' } as any);

      const state = useTimedTextTrackApi.getState();
      expect(state[modelName.TIMEDTEXTTRACKS].timedTextTrack).toEqual({ id: 'timedTextTrack' });
    });
    it('adds a video resource', () => {
      addResource(modelName.VIDEOS, { id: 'video' } as any);

      const state = useVideoApi.getState();
      expect(state[modelName.VIDEOS].video).toEqual({ id: 'video' });
    });
  });
  describe('getResource', () => {
    it('fetch an existing thumbnail resource and return it', () => {
      addResource(modelName.THUMBNAIL, { id: 'thumbnail' } as any);

      expect(getResource(modelName.THUMBNAIL, 'thumbnail')).toEqual({ id: 'thumbnail' });
    });
    it('fetch a non existing thumbnail and should return undefined', () => {
      expect(getResource(modelName.THUMBNAIL, 'foo')).toBeUndefined();
    });
    it('fetch an existing timed text resource and return it', () => {
      addResource(modelName.TIMEDTEXTTRACKS, { id: 'timedtext' } as any);

      expect(getResource(modelName.TIMEDTEXTTRACKS, 'timedtext')).toEqual({ id: 'timedtext' });
    });
    it('fetch a non existing timed text and should return undefined', () => {
      expect(getResource(modelName.TIMEDTEXTTRACKS, 'foo')).toBeUndefined();
    });
    it('fetch an existing video resource and return it', () => {
      addResource(modelName.VIDEOS, { id: 'video' } as any);

      expect(getResource(modelName.VIDEOS, 'video')).toEqual({ id: 'video' });
    });
    it('fetch a non existing video and should return undefined', () => {
      expect(getResource(modelName.VIDEOS, 'foo')).toBeUndefined();
    });
  });
  describe('addMultipleResources', () => {
    it('adds multiple thumbnails', () => {
      addMultipleResources(modelName.THUMBNAIL, [
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

      const state = useThumbnailApi.getState();

      expect(state[modelName.THUMBNAIL].multi1).toEqual({ id: 'multi1' });
      expect(state[modelName.THUMBNAIL].multi2).toEqual({ id: 'multi2' });
      expect(state[modelName.THUMBNAIL].multi3).toEqual({ id: 'multi3' });
    });
    it('adds multiple timed text tracks', () => {
      addMultipleResources(modelName.TIMEDTEXTTRACKS, [
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

      const state = useTimedTextTrackApi.getState();

      expect(state[modelName.TIMEDTEXTTRACKS].multi1).toEqual({ id: 'multi1' });
      expect(state[modelName.TIMEDTEXTTRACKS].multi2).toEqual({ id: 'multi2' });
      expect(state[modelName.TIMEDTEXTTRACKS].multi3).toEqual({ id: 'multi3' });
    });
    it('adds multiple videos', () => {
      addMultipleResources(modelName.VIDEOS, [
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

      const state = useVideoApi.getState();

      expect(state[modelName.VIDEOS].multi1).toEqual({ id: 'multi1' });
      expect(state[modelName.VIDEOS].multi2).toEqual({ id: 'multi2' });
      expect(state[modelName.VIDEOS].multi3).toEqual({ id: 'multi3' });
    });
  });
});
