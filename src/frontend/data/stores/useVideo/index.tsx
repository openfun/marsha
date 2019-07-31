import create from 'zustand';

import { Video } from '../../../types/tracks';
import { Nullable } from '../../../utils/types';
import { appData } from '../../appData';

interface State {
  getVideo: (video: Nullable<Video>) => Video;
  videos: {
    [id: string]: Video;
  };
}

export const [useVideo] = create<State>((set, get) => ({
  getVideo: (video: Nullable<Video>) => {
    return get().videos[(video && video.id) || ''] || video;
  },
  videos: {
    ...(appData.video ? { [appData.video.id]: appData.video } : {}),
  },
}));
