import { modelName as markdownModelName } from 'apps/markdown/types/models';
import { modelName as depositModelName } from 'apps/deposit/types/models';

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
  | Extract<depositModelName, depositModelName.DepositedFiles>;
