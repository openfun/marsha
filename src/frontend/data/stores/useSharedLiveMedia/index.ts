import create from 'zustand';

import { appData } from 'data/appData';
import {
  addMultipleResources,
  addResource,
  removeResource,
} from 'data/stores/actions';
import { modelName } from 'types/models';
import { StoreState } from 'types/stores';
import { SharedLiveMedia } from 'types/tracks';

type ShareLiveMediaStateResource = {
  [modelName.SHAREDLIVEMEDIAS]: {
    [id: string]: SharedLiveMedia;
  };
};

type SharedLiveMediaState = StoreState<SharedLiveMedia> &
  ShareLiveMediaStateResource & {
    getSharedLiveMedias: () => SharedLiveMedia[];
  };

export const useSharedLiveMedia = create<SharedLiveMediaState>((set, get) => {
  const sharedLiveMedias: { [id: string]: SharedLiveMedia } = {};
  if (
    appData.video &&
    appData.video.shared_live_medias &&
    appData.video.shared_live_medias.length > 0
  ) {
    appData.video.shared_live_medias.forEach(
      (sharedLiveMedia) =>
        (sharedLiveMedias[sharedLiveMedia.id] = sharedLiveMedia),
    );
  }

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
    [modelName.SHAREDLIVEMEDIAS]: sharedLiveMedias,
  };
});
