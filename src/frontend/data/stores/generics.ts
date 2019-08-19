import { modelName } from '../../types/models';
import { UploadableObject } from '../../types/tracks';

const getStore = async (objectType: modelName) => {
  switch (objectType) {
    case modelName.THUMBNAIL:
      const { useThumbnailApi } = await import('./useThumbnail');
      return useThumbnailApi;
    case modelName.TIMEDTEXTTRACKS:
      const { useTimedTextTrackApi } = await import('./useTimedTextTrack');
      return useTimedTextTrackApi;
    case modelName.VIDEOS:
      const { useVideoApi } = await import('./useVideo');
      return useVideoApi;
    case modelName.DOCUMENTS:
      const { useDocumentApi } = await import('./useDocument');
      return useDocumentApi;
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
