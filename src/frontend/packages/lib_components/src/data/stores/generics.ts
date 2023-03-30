/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClassroomModelName } from '@lib-components/types/apps/classroom/models';
import { FileDepositoryModelName } from '@lib-components/types/apps/deposit/models';
import { MarkdownDocumentModelName } from '@lib-components/types/apps/markdown/models';
import { modelName, uploadableModelName } from '@lib-components/types/models';
import { UploadableObject } from '@lib-components/types/tracks';

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
    case MarkdownDocumentModelName.MARKDOWN_IMAGES:
      const { useMarkdownImage } = await import('./useMarkdownImage');
      return useMarkdownImage;
    case FileDepositoryModelName.DepositedFiles:
      const { useDepositedFile } = await import('./useDepositedFile');
      return useDepositedFile;
    case ClassroomModelName.CLASSROOM_DOCUMENTS:
    default:
      const { useClassroomDocument } = await import('./useClassroomDocument');
      return useClassroomDocument;
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

export const getStoreResource = async (
  objectType: uploadableModelName,
  objectId: string,
) => {
  const store = await getStore(objectType);
  const state = store.getState();
  const stateObjectType = state[objectType];

  return stateObjectType && stateObjectType[objectId];
};
