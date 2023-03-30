import { create } from 'zustand';

import {
  addMultipleResources,
  addResource,
  removeResource,
} from '@lib-components/data/stores/actions';
import { modelName } from '@lib-components/types/models';
import { StoreState } from '@lib-components/types/stores';
import { SharedLiveMedia } from '@lib-components/types/tracks';

type ShareLiveMediaStateResource = {
  [modelName.SHAREDLIVEMEDIAS]: {
    [id: string]: SharedLiveMedia;
  };
};

type SharedLiveMediaState = StoreState<SharedLiveMedia> &
  ShareLiveMediaStateResource & {
    getSharedLiveMedias: () => SharedLiveMedia[];
    reset: () => void;
  };

export const useSharedLiveMedia = create<SharedLiveMediaState>((set, get) => {
  return {
    addMultipleResources: (sharedLiveMediaToAdd: SharedLiveMedia[]) =>
      set(
        addMultipleResources(
          get(),
          modelName.SHAREDLIVEMEDIAS,
          sharedLiveMediaToAdd,
        ) as ShareLiveMediaStateResource,
      ),
    addResource: (sharedLiveMedia: SharedLiveMedia) =>
      set(
        addResource<SharedLiveMedia>(
          get(),
          modelName.SHAREDLIVEMEDIAS,
          sharedLiveMedia,
        ) as ShareLiveMediaStateResource,
      ),
    getSharedLiveMedias: () => {
      return Object.values(get()[modelName.SHAREDLIVEMEDIAS]);
    },
    removeResource: (sharedLiveMedia: SharedLiveMedia) =>
      set(
        removeResource(
          get(),
          modelName.SHAREDLIVEMEDIAS,
          sharedLiveMedia,
        ) as ShareLiveMediaStateResource,
      ),
    [modelName.SHAREDLIVEMEDIAS]: {},
    reset: () => {
      set({ [modelName.SHAREDLIVEMEDIAS]: {} });
    },
  };
});
