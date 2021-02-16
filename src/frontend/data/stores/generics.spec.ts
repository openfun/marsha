import { ModelName } from '../../types/models';
import { addMultipleResources, addResource, getResource } from './generics';
import { useThumbnail } from './useThumbnail';
import { useTimedTextTrack } from './useTimedTextTrack';
import { useVideo } from './useVideo';

jest.mock('../../data/appData', () => ({
  appData: {},
}));

describe('stores/generics', () => {
  afterEach(() => {
    // restore the state of each store.
    useVideo.setState({
      [ModelName.VIDEOS]: {},
    });
    useThumbnail.setState({
      [ModelName.THUMBNAILS]: {},
    });
    useTimedTextTrack.setState({
      [ModelName.TIMEDTEXTTRACKS]: {},
    });
  });

  describe('addResource', () => {
    it('adds a thumbnail resource', async () => {
      await addResource(ModelName.THUMBNAILS, { id: 'thumbnail' } as any);

      const state = useThumbnail.getState();
      expect(state[ModelName.THUMBNAILS].thumbnail).toEqual({
        id: 'thumbnail',
      });
    });
    it('adds a timed text track resource', async () => {
      await addResource(ModelName.TIMEDTEXTTRACKS, {
        id: 'timedTextTrack',
      } as any);

      const state = useTimedTextTrack.getState();
      expect(state[ModelName.TIMEDTEXTTRACKS].timedTextTrack).toEqual({
        id: 'timedTextTrack',
      });
    });
    it('adds a video resource', async () => {
      await addResource(ModelName.VIDEOS, { id: 'video' } as any);

      const state = useVideo.getState();
      expect(state[ModelName.VIDEOS].video).toEqual({ id: 'video' });
    });
  });

  describe('getResource', () => {
    it('fetch an existing thumbnail resource and return it', async () => {
      await addResource(ModelName.THUMBNAILS, { id: 'thumbnail' } as any);

      expect(await getResource(ModelName.THUMBNAILS, 'thumbnail')).toEqual({
        id: 'thumbnail',
      });
    });
    it('fetch a non existing thumbnail and should return undefined', async () => {
      expect(await getResource(ModelName.THUMBNAILS, 'foo')).toBeUndefined();
    });
    it('fetch an existing timed text resource and return it', async () => {
      await addResource(ModelName.TIMEDTEXTTRACKS, { id: 'timedtext' } as any);

      expect(await getResource(ModelName.TIMEDTEXTTRACKS, 'timedtext')).toEqual(
        {
          id: 'timedtext',
        },
      );
    });
    it('fetch a non existing timed text and should return undefined', async () => {
      expect(
        await getResource(ModelName.TIMEDTEXTTRACKS, 'foo'),
      ).toBeUndefined();
    });
    it('fetch an existing video resource and return it', async () => {
      await addResource(ModelName.VIDEOS, { id: 'video' } as any);

      expect(await getResource(ModelName.VIDEOS, 'video')).toEqual({
        id: 'video',
      });
    });
    it('fetch a non existing video and should return undefined', async () => {
      expect(await getResource(ModelName.VIDEOS, 'foo')).toBeUndefined();
    });
  });

  describe('addMultipleResources', () => {
    it('adds multiple thumbnails', async () => {
      await addMultipleResources(ModelName.THUMBNAILS, [
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

      const state = useThumbnail.getState();

      expect(state[ModelName.THUMBNAILS].multi1).toEqual({ id: 'multi1' });
      expect(state[ModelName.THUMBNAILS].multi2).toEqual({ id: 'multi2' });
      expect(state[ModelName.THUMBNAILS].multi3).toEqual({ id: 'multi3' });
    });
    it('adds multiple timed text tracks', async () => {
      await addMultipleResources(ModelName.TIMEDTEXTTRACKS, [
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

      const state = useTimedTextTrack.getState();

      expect(state[ModelName.TIMEDTEXTTRACKS].multi1).toEqual({ id: 'multi1' });
      expect(state[ModelName.TIMEDTEXTTRACKS].multi2).toEqual({ id: 'multi2' });
      expect(state[ModelName.TIMEDTEXTTRACKS].multi3).toEqual({ id: 'multi3' });
    });
    it('adds multiple videos', async () => {
      await addMultipleResources(ModelName.VIDEOS, [
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

      const state = useVideo.getState();

      expect(state[ModelName.VIDEOS].multi1).toEqual({ id: 'multi1' });
      expect(state[ModelName.VIDEOS].multi2).toEqual({ id: 'multi2' });
      expect(state[ModelName.VIDEOS].multi3).toEqual({ id: 'multi3' });
    });
  });
});
