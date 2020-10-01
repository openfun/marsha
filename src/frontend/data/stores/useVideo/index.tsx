import create from 'zustand';

import { modelName } from '../../../types/models';
import { StoreState } from '../../../types/stores';
import { Video } from '../../../types/tracks';
import { Nullable } from '../../../utils/types';
import { appData } from '../../appData';
import { addMultipleResources, addResource, removeResource } from '../actions';

type VideoState = StoreState<Video> & {
  getVideo: (video: Nullable<Video>) => Video;
  [modelName.VIDEOS]: {
    [id: string]: Video;
  };
};

export const useVideo = create<VideoState>((set, get) => ({
  addMultipleResources: (videosToAdd: Video[]) =>
    set(addMultipleResources(get(), modelName.VIDEOS, videosToAdd)),
  addResource: (video: Video) =>
    set(addResource<Video>(get(), modelName.VIDEOS, video)),
  getVideo: (video: Nullable<Video>) => {
    return get()[modelName.VIDEOS][(video && video.id) || ''] || video;
  },
  removeResource: (video: Video) =>
    set(removeResource(get(), modelName.VIDEOS, video)),
  [modelName.VIDEOS]: {
    ...(appData.video ? { [appData.video.id]: appData.video } : {}),
  },
}));
