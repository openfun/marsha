import { SharedLiveMedia } from '@lib-components/types/tracks';
import videojs from 'video.js';

export interface SharedLiveMediaItemOptions extends videojs.MenuItemOptions {
  label: string;
  src: string | undefined;
}

export interface SharedLiveMediaOptions {
  sharedLiveMedias: SharedLiveMedia[];
}
