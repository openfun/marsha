import create from 'zustand';

import { ModelName } from '../../../types/models';
import { StoreState } from '../../../types/stores';
import { Video } from '../../../types/tracks';
import { Nullable } from '../../../utils/types';
import { appData } from '../../appData';
import { addMultipleResources, addResource, removeResource } from '../actions';

type VideoState = StoreState<Video> & {
  getVideo: (video: Nullable<Video>) => Video;
  [ModelName.VIDEOS]: {
    [id: string]: Video;
  };
};

export const useVideo = create<VideoState>((set, get) => ({
  addMultipleResources: (videosToAdd: Video[]) =>
    set(addMultipleResources(get(), ModelName.VIDEOS, videosToAdd)),
  addResource: (video: Video) =>
    set(addResource<Video>(get(), ModelName.VIDEOS, video)),
  getVideo: (video: Nullable<Video>) => {
    return get()[ModelName.VIDEOS][(video && video.id) || ''] || video;
  },
  removeResource: (video: Video) =>
    set(removeResource(get(), ModelName.VIDEOS, video)),
  [ModelName.VIDEOS]: {
    ...(appData.video ? { [appData.video.id]: appData.video } : {}),
  },
}));
