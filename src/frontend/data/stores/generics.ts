import { ModelName } from '../../types/models';
import { UploadableObject } from '../../types/tracks';

const getStore = async (objectType: ModelName) => {
  switch (objectType) {
    case ModelName.THUMBNAILS: {
      const { useThumbnail } = await import('./useThumbnail');
      return useThumbnail;
    }
    case ModelName.TIMEDTEXTTRACKS: {
      const { useTimedTextTrack } = await import('./useTimedTextTrack');
      return useTimedTextTrack;
    }
    case ModelName.VIDEOS: {
      const { useVideo } = await import('./useVideo');
      return useVideo;
    }
    case ModelName.DOCUMENTS: {
      const { useDocument } = await import('./useDocument');
      return useDocument;
    }
  }
};

export const addMultipleResources = async (
  objectType: ModelName,
  objects: UploadableObject[],
) => {
  const store = await getStore(objectType);
  store.getState().addMultipleResources(objects as any);
};

export const addResource = async (
  objectType: ModelName,
  object: UploadableObject,
) => {
  const store = await getStore(objectType);
  store.getState().addResource(object as any);
};

export const getResource = async (objectType: ModelName, objectId: string) => {
  const store = await getStore(objectType);
  const state = store.getState();
  return state[objectType] && state[objectType]![objectId];
};
