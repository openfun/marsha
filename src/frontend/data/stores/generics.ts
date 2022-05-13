import { modelName } from 'types/models';
import { UploadableObject } from 'types/tracks';

const getStore = async (objectType: modelName) => {
  switch (objectType) {
    case modelName.THUMBNAILS:
      const { useThumbnail } = await import('./useThumbnail');
      return useThumbnail;
    case modelName.TIMEDTEXTTRACKS:
      const { useTimedTextTrack } = await import('./useTimedTextTrack');
      return useTimedTextTrack;
    case modelName.VIDEOS:
      const { useVideo } = await import('./useVideo');
      return useVideo;
    case modelName.DOCUMENTS:
      const { useDocument } = await import('./useDocument');
      return useDocument;
    case modelName.SHAREDLIVEMEDIAS:
      const { useSharedLiveMedia } = await import('./useSharedLiveMedia');
      return useSharedLiveMedia;
  }
};

export const addMultipleResources = async (
  objectType: modelName,
  objects: UploadableObject[],
) => {
  const store = await getStore(objectType);
  store.getState().addMultipleResources(objects as any);
};

export const addResource = async (
  objectType: modelName,
  object: UploadableObject,
) => {
  const store = await getStore(objectType);
  store.getState().addResource(object as any);
};

export const getResource = async (objectType: modelName, objectId: string) => {
  const store = await getStore(objectType);
  const state = store.getState();
  return state[objectType] && state[objectType]![objectId];
};
