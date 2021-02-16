import { Document } from './file';
import { ModelName } from './models';
import { Resource, Thumbnail, TimedText, Video } from './tracks';

export type StoreState<R extends Resource> = {
  addResource: (Resource: R) => void;
  addMultipleResources: (Resources: R[]) => void;
  removeResource: (Resource: R) => void;
  [ModelName.THUMBNAILS]?: {
    [id: string]: Thumbnail;
  };
  [ModelName.TIMEDTEXTTRACKS]?: {
    [id: string]: TimedText;
  };
  [ModelName.VIDEOS]?: {
    [id: string]: Video;
  };
  [ModelName.DOCUMENTS]?: {
    [id: string]: Document;
  };
};
