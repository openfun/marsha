import create from 'zustand';

import { Thumbnail } from '../../../types/tracks';
import { Nullable } from '../../../utils/types';
import { appData } from '../../appData';

interface State {
  getThumbnail: () => Nullable<Thumbnail>;
  thumbnails: {
    [id: string]: Thumbnail;
  };
}

export const [useThumbnail] = create<State>((set, get) => {
  let thumbnails = {};

  if (appData.video && appData.video.thumbnail !== null) {
    thumbnails = {
      [appData.video.thumbnail.id]: appData.video.thumbnail,
    };
  }

  return {
    getThumbnail: () => {
      if (get().thumbnails) {
        const thumbnailId = Object.keys(get().thumbnails).shift();
        return get().thumbnails[thumbnailId!];
      }

      return null;
    },
    thumbnails,
  };
});
