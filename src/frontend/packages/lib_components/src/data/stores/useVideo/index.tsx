import { Nullable } from 'lib-common';
import { create } from 'zustand';

import {
  addMultipleResources,
  addResource,
  removeResource,
} from '@lib-components/data/stores/actions';
import { modelName } from '@lib-components/types/models';
import { StoreState } from '@lib-components/types/stores';
import { Video, Id3VideoType } from '@lib-components/types/tracks';

type VideoStateResource = {
  [modelName.VIDEOS]: {
    [id: string]: Video;
  };
};

type VideoState = StoreState<Video> &
  VideoStateResource & {
    getVideo: (video: Nullable<Video>) => Video;
    id3Video: Nullable<Id3VideoType>;
    setId3Video: (id3Video: Nullable<Id3VideoType>) => void;
    isWatchingVideo: boolean;
    setIsWatchingVideo: (isWatching: boolean) => void;
  };

export const useVideo = create<VideoState>((set, get) => ({
  addMultipleResources: (videosToAdd: Video[]) =>
    set(
      addMultipleResources(
        get(),
        modelName.VIDEOS,
        videosToAdd,
      ) as VideoStateResource,
    ),
  addResource: (video: Video) => {
    // TODO: Remove this hack
    // This is a hack to keep existing jitsi infos in updated videos.
    // Should be removed when we have a proper way to send those infos
    // through websocket for participants in discussion.
    const lastVideoState = get()[modelName.VIDEOS][video.id];
    if (lastVideoState?.live_info?.jitsi) {
      video = {
        ...video,
        live_info: {
          ...video.live_info,
          jitsi: lastVideoState.live_info.jitsi,
        },
      };
    }
    return set(
      addResource<Video>(get(), modelName.VIDEOS, video) as VideoStateResource,
    );
  },
  getVideo: (video: Nullable<Video>) => {
    return get()[modelName.VIDEOS][(video && video.id) || ''] || video;
  },
  removeResource: (video: Video) =>
    set(removeResource(get(), modelName.VIDEOS, video) as VideoStateResource),
  [modelName.VIDEOS]: {},
  isWatchingVideo: false,
  setIsWatchingVideo: (isWatching: boolean) => {
    set((state) => ({ ...state, isWatchingVideo: isWatching }));
  },
  id3Video: null,
  setId3Video: (video: Nullable<Id3VideoType>) => {
    set((state) => ({ ...state, id3Video: video }));
  },
}));
