import {
  addMultipleResources,
  addResource,
  getStoreResource,
} from '@lib-components/data/stores/generics';
import { useDocument } from '@lib-components/data/stores/useDocument';
import { useSharedLiveMedia } from '@lib-components/data/stores/useSharedLiveMedia';
import { useThumbnail } from '@lib-components/data/stores/useThumbnail';
import { useTimedTextTrack } from '@lib-components/data/stores/useTimedTextTrack';
import { useVideo } from '@lib-components/data/stores/useVideo';
import { modelName } from '@lib-components/types/models';

describe('stores/generics', () => {
  afterEach(() => {
    // restore the state of each store.
    useVideo.setState({
      [modelName.VIDEOS]: {},
    });
    useThumbnail.setState({
      [modelName.THUMBNAILS]: {},
    });
    useTimedTextTrack.setState({
      [modelName.TIMEDTEXTTRACKS]: {},
    });
    useDocument.setState({
      [modelName.DOCUMENTS]: {},
    });
    useSharedLiveMedia.setState({
      [modelName.SHAREDLIVEMEDIAS]: {},
    });
  });

  describe('addResource', () => {
    it('adds a thumbnail resource', async () => {
      await addResource(modelName.THUMBNAILS, { id: 'thumbnail' } as any);

      const state = useThumbnail.getState();
      expect(state[modelName.THUMBNAILS].thumbnail).toEqual({
        id: 'thumbnail',
      });
    });
    it('adds a timed text track resource', async () => {
      await addResource(modelName.TIMEDTEXTTRACKS, {
        id: 'timedTextTrack',
      } as any);

      const state = useTimedTextTrack.getState();
      expect(state[modelName.TIMEDTEXTTRACKS].timedTextTrack).toEqual({
        id: 'timedTextTrack',
      });
    });
    it('adds a video resource', async () => {
      await addResource(modelName.VIDEOS, { id: 'video' } as any);

      const state = useVideo.getState();
      expect(state[modelName.VIDEOS].video).toEqual({ id: 'video' });
    });
    it('adds a document resource', async () => {
      await addResource(modelName.DOCUMENTS, { id: 'document' } as any);

      const state = useDocument.getState();
      expect(state[modelName.DOCUMENTS].document).toEqual({ id: 'document' });
    });
    it('adds a shared live media resource', async () => {
      await addResource(modelName.SHAREDLIVEMEDIAS, {
        id: 'sharedLiveMedia',
      } as any);

      const state = useSharedLiveMedia.getState();
      expect(state[modelName.SHAREDLIVEMEDIAS].sharedLiveMedia).toEqual({
        id: 'sharedLiveMedia',
      });
    });
  });

  describe('getResource', () => {
    it('fetches an existing thumbnail resource and returns it', async () => {
      await addResource(modelName.THUMBNAILS, { id: 'thumbnail' } as any);

      expect(await getStoreResource(modelName.THUMBNAILS, 'thumbnail')).toEqual(
        {
          id: 'thumbnail',
        },
      );
    });
    it('fetches a non existing thumbnail and should return undefined', async () => {
      expect(
        await getStoreResource(modelName.THUMBNAILS, 'foo'),
      ).toBeUndefined();
    });
    it('fetches an existing timed text resource and returns it', async () => {
      await addResource(modelName.TIMEDTEXTTRACKS, { id: 'timedtext' } as any);

      expect(
        await getStoreResource(modelName.TIMEDTEXTTRACKS, 'timedtext'),
      ).toEqual({
        id: 'timedtext',
      });
    });
    it('fetches a non existing timed text and should return undefined', async () => {
      expect(
        await getStoreResource(modelName.TIMEDTEXTTRACKS, 'foo'),
      ).toBeUndefined();
    });
    it('fetches an existing video resource and returns it', async () => {
      await addResource(modelName.VIDEOS, { id: 'video' } as any);

      expect(await getStoreResource(modelName.VIDEOS, 'video')).toEqual({
        id: 'video',
      });
    });
    it('fetches a non existing video and should return undefined', async () => {
      expect(await getStoreResource(modelName.VIDEOS, 'foo')).toBeUndefined();
    });
    it('fetches an existing document resource and returns it', async () => {
      await addResource(modelName.DOCUMENTS, { id: 'document' } as any);

      expect(await getStoreResource(modelName.DOCUMENTS, 'document')).toEqual({
        id: 'document',
      });
    });
    it('fetch a non existing document and should return undefined', async () => {
      expect(
        await getStoreResource(modelName.DOCUMENTS, 'foo'),
      ).toBeUndefined();
    });
    it('fetches an existing shared live media resource and returns it', async () => {
      await addResource(modelName.SHAREDLIVEMEDIAS, {
        id: 'sharedLiveMedia',
      } as any);

      expect(
        await getStoreResource(modelName.SHAREDLIVEMEDIAS, 'sharedLiveMedia'),
      ).toEqual({
        id: 'sharedLiveMedia',
      });
    });
    it('fetch a non existing shared live media and should return undefined', async () => {
      expect(
        await getStoreResource(modelName.SHAREDLIVEMEDIAS, 'foo'),
      ).toBeUndefined();
    });
  });

  describe('addMultipleResources', () => {
    it('adds multiple thumbnails', async () => {
      await addMultipleResources(modelName.THUMBNAILS, [
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

      const state = useThumbnail.getState();

      expect(state[modelName.THUMBNAILS].multi1).toEqual({ id: 'multi1' });
      expect(state[modelName.THUMBNAILS].multi2).toEqual({ id: 'multi2' });
      expect(state[modelName.THUMBNAILS].multi3).toEqual({ id: 'multi3' });
    });
    it('adds multiple timed text tracks', async () => {
      await addMultipleResources(modelName.TIMEDTEXTTRACKS, [
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

      const state = useTimedTextTrack.getState();

      expect(state[modelName.TIMEDTEXTTRACKS].multi1).toEqual({ id: 'multi1' });
      expect(state[modelName.TIMEDTEXTTRACKS].multi2).toEqual({ id: 'multi2' });
      expect(state[modelName.TIMEDTEXTTRACKS].multi3).toEqual({ id: 'multi3' });
    });
    it('adds multiple videos', async () => {
      await addMultipleResources(modelName.VIDEOS, [
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

      const state = useVideo.getState();

      expect(state[modelName.VIDEOS].multi1).toEqual({ id: 'multi1' });
      expect(state[modelName.VIDEOS].multi2).toEqual({ id: 'multi2' });
      expect(state[modelName.VIDEOS].multi3).toEqual({ id: 'multi3' });
    });
    it('adds multiple documents', async () => {
      await addMultipleResources(modelName.DOCUMENTS, [
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

      const state = useDocument.getState();

      expect(state[modelName.DOCUMENTS].multi1).toEqual({ id: 'multi1' });
      expect(state[modelName.DOCUMENTS].multi2).toEqual({ id: 'multi2' });
      expect(state[modelName.DOCUMENTS].multi3).toEqual({ id: 'multi3' });
    });
    it('adds multiple shared live medias', async () => {
      await addMultipleResources(modelName.SHAREDLIVEMEDIAS, [
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

      const state = useSharedLiveMedia.getState();

      expect(state[modelName.SHAREDLIVEMEDIAS].multi1).toEqual({
        id: 'multi1',
      });
      expect(state[modelName.SHAREDLIVEMEDIAS].multi2).toEqual({
        id: 'multi2',
      });
      expect(state[modelName.SHAREDLIVEMEDIAS].multi3).toEqual({
        id: 'multi3',
      });
    });
  });
});
