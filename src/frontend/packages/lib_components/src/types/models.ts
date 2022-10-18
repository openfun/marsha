import { ClassroomModelName } from 'types/apps/classroom/models';
import { FileDepositoryModelName } from 'types/apps/deposit/models';
import { MarkdownDocumentModelName } from 'types/apps/markdown/models';

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
