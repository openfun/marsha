import { modelName } from '../../types/models';
import { UploadableObject } from '../../types/tracks';
import { useThumbnailApi } from './useThumbnail';
import { useTimedTextTrackApi } from './useTimedTextTrack';
import { useVideoApi } from './useVideo';

const getStore = (objectType: modelName) => {
  switch (objectType) {
    case modelName.THUMBNAIL:
      return useThumbnailApi;
    case modelName.TIMEDTEXTTRACKS:
      return useTimedTextTrackApi;
    case modelName.VIDEOS:
      return useVideoApi;
  }
};

export const addMultipleResources = (
  objectType: modelName,
  objects: UploadableObject[],
) => {
  getStore(objectType)
    .getState()
    .addMultipleResources(objects as any);
};

export const addResource = (
  objectType: modelName,
  object: UploadableObject,
) => {
  getStore(objectType)
    .getState()
    .addResource(object as any);
};

export const getResource = (objectType: modelName, objectId: string) => {
  const state = getStore(objectType).getState();
  return state[objectType] && state[objectType]![objectId];
};
