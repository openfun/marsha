import { modelName as classroomModelName } from 'types/apps/classroom/models';
import { modelName as depositModelName } from 'types/apps/deposit/models';
import { modelName as markdownModelName } from 'types/apps/markdown/models';

export enum modelName {
  TIMEDTEXTTRACKS = 'timedtexttracks',
  THUMBNAILS = 'thumbnails',
  VIDEOS = 'videos',
  DOCUMENTS = 'documents',
  SHAREDLIVEMEDIAS = 'sharedlivemedias',
}

export type uploadableModelName =
  | modelName
  | Extract<markdownModelName, markdownModelName.MARKDOWN_IMAGES>
  | Extract<depositModelName, depositModelName.DepositedFiles>
  | Extract<classroomModelName, classroomModelName.CLASSROOM_DOCUMENTS>;
