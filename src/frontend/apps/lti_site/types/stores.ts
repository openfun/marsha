import { Document } from './file';
import { modelName } from './models';
import {
  Resource,
  Thumbnail,
  TimedText,
  Video,
  SharedLiveMedia,
} from './tracks';
import {
  MarkdownImage,
  modelName as markdownModelName,
} from 'apps/markdown/types/models';

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
  [markdownModelName.MARKDOWN_IMAGES]?: {
    [id: string]: MarkdownImage;
  };
};
