import { modelName, uploadableModelName } from 'types/models';
import { modelName as markdownModelName } from 'apps/markdown/types/models';
import { modelName as depositModelName } from 'apps/deposit/types/models';
import { UploadableObject } from 'types/tracks';

const getStore = async (objectType: uploadableModelName) => {
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
    case markdownModelName.MARKDOWN_IMAGES:
      const { useMarkdownImage } = await import('./useMarkdownImage');
      return useMarkdownImage;
    case depositModelName.DepositedFiles:
      const { useDepositedFile } = await import('./useDepositedFile');
      return useDepositedFile;
  }
};

export const addMultipleResources = async (
  objectType: uploadableModelName,
  objects: UploadableObject[],
) => {
  const store = await getStore(objectType);
  store.getState().addMultipleResources(objects as any);
};

export const addResource = async (
  objectType: uploadableModelName,
  object: UploadableObject,
) => {
  const store = await getStore(objectType);
  store.getState().addResource(object as any);
};

export const getResource = async (
  objectType: uploadableModelName,
  objectId: string,
) => {
  const store = await getStore(objectType);
  const state = store.getState();
  return state[objectType] && state[objectType]![objectId];
};
