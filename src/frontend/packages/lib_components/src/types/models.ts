import { Nullable } from '@lib-common/types';

import { ClassroomModelName } from '@lib-components/types/apps/classroom/models';
import { FileDepositoryModelName } from '@lib-components/types/apps/deposit/models';
import { MarkdownDocumentModelName } from '@lib-components/types/apps/markdown/models';

export enum modelName {
  TIMEDTEXTTRACKS = 'timedtexttracks',
  THUMBNAILS = 'thumbnails',
  VIDEOS = 'videos',
  DOCUMENTS = 'documents',
  SHAREDLIVEMEDIAS = 'sharedlivemedias',
}

export type uploadableModelName =
  | modelName
  | Extract<
      MarkdownDocumentModelName,
      MarkdownDocumentModelName.MARKDOWN_IMAGES
    >
  | Extract<FileDepositoryModelName, FileDepositoryModelName.DepositedFiles>
  | Extract<ClassroomModelName, ClassroomModelName.CLASSROOM_DOCUMENTS>;

export type parentType =
  | modelName.VIDEOS
  | MarkdownDocumentModelName.MARKDOWN_DOCUMENTS
  | ClassroomModelName.CLASSROOMS
  | FileDepositoryModelName.FileDepositories;

export const getParentType = (
  objectType: Nullable<uploadableModelName>,
): Nullable<parentType> => {
  switch (objectType) {
    case modelName.TIMEDTEXTTRACKS:
      return modelName.VIDEOS;
    case modelName.SHAREDLIVEMEDIAS:
      return modelName.VIDEOS;
    case modelName.THUMBNAILS:
      return modelName.VIDEOS;
    case MarkdownDocumentModelName.MARKDOWN_IMAGES:
      return MarkdownDocumentModelName.MARKDOWN_DOCUMENTS;
    case FileDepositoryModelName.DepositedFiles:
      return FileDepositoryModelName.FileDepositories;
    case ClassroomModelName.CLASSROOM_DOCUMENTS:
      return ClassroomModelName.CLASSROOMS;
    default:
      return null;
  }
};
