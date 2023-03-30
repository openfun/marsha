import {
  ClassroomDocument,
  ClassroomModelName,
} from '@lib-components/types/apps/classroom/models';
import {
  DepositedFile,
  FileDepositoryModelName,
} from '@lib-components/types/apps/deposit/models';
import {
  MarkdownImage,
  MarkdownDocumentModelName,
} from '@lib-components/types/apps/markdown/models';

import { Document } from './file';
import { modelName } from './models';
import {
  Resource,
  Thumbnail,
  TimedText,
  Video,
  SharedLiveMedia,
} from './tracks';

export type StoreState<R extends Resource> = {
  addResource: (Resource: R) => void;
  addMultipleResources: (Resources: R[]) => void;
  removeResource: (Resource: R) => void;
  [modelName.THUMBNAILS]?: {
    [id: string]: Thumbnail;
  };
  [modelName.TIMEDTEXTTRACKS]?: {
    [id: string]: TimedText;
  };
  [modelName.VIDEOS]?: {
    [id: string]: Video;
  };
  [modelName.DOCUMENTS]?: {
    [id: string]: Document;
  };
  [modelName.SHAREDLIVEMEDIAS]?: {
    [id: string]: SharedLiveMedia;
  };
  [MarkdownDocumentModelName.MARKDOWN_IMAGES]?: {
    [id: string]: MarkdownImage;
  };
  [FileDepositoryModelName.DepositedFiles]?: {
    [id: string]: DepositedFile;
  };
  [ClassroomModelName.CLASSROOM_DOCUMENTS]?: {
    [id: string]: ClassroomDocument;
  };
};
