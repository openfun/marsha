/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ClassroomModelName } from '@lib-components/types/apps/classroom/models';
import { FileDepositoryModelName } from '@lib-components/types/apps/deposit/models';
import { MarkdownDocumentModelName } from '@lib-components/types/apps/markdown/models';
import { modelName, uploadableModelName } from '@lib-components/types/models';
import { UploadableObject } from '@lib-components/types/tracks';

import { useClassroomDocument } from './useClassroomDocument';
import { useDepositedFile } from './useDepositedFile';
import { useDocument } from './useDocument';
import { useMarkdownImage } from './useMarkdownImage';
import { useSharedLiveMedia } from './useSharedLiveMedia';
import { useThumbnail } from './useThumbnail';
import { useTimedTextTrack } from './useTimedTextTrack';
import { useVideo } from './useVideo';

const getStore = (objectType: uploadableModelName) => {
  switch (objectType) {
    case modelName.THUMBNAILS:
      return useThumbnail;
    case modelName.TIMEDTEXTTRACKS:
      return useTimedTextTrack;
    case modelName.VIDEOS:
      return useVideo;
    case modelName.DOCUMENTS:
      return useDocument;
    case modelName.SHAREDLIVEMEDIAS:
      return useSharedLiveMedia;
    case MarkdownDocumentModelName.MARKDOWN_IMAGES:
      return useMarkdownImage;
    case FileDepositoryModelName.DepositedFiles:
      return useDepositedFile;
    case ClassroomModelName.CLASSROOM_DOCUMENTS:
    default:
      return useClassroomDocument;
  }
};

export const addMultipleResources = (
  objectType: uploadableModelName,
  objects: UploadableObject[],
) => {
  const store = getStore(objectType);
  store.getState().addMultipleResources(objects as any);
};

export const addResource = (
  objectType: uploadableModelName,
  object: UploadableObject,
) => {
  const store = getStore(objectType);
  store.getState().addResource(object as any);
};

export const getStoreResource = (
  objectType: uploadableModelName,
  objectId: string,
) => {
  const store = getStore(objectType);
  const state = store.getState();
  const stateObjectType = state[objectType];

  return stateObjectType && stateObjectType[objectId];
};
