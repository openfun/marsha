import create from 'zustand';

import { ModelName } from '../../../types/models';
import { StoreState } from '../../../types/stores';
import { Thumbnail } from '../../../types/tracks';
import { Nullable } from '../../../utils/types';
import { appData } from '../../appData';
import { addMultipleResources, addResource, removeResource } from '../actions';

type ThumbnailState = StoreState<Thumbnail> & {
  getThumbnail: () => Nullable<Thumbnail>;
  [ModelName.THUMBNAILS]: {
    [id: string]: Thumbnail;
  };
};

export const useThumbnail = create<ThumbnailState>((set, get) => {
  let thumbnails = {};
  if (appData.video && appData.video.thumbnail !== null) {
    thumbnails = {
      [appData.video.thumbnail.id]: appData.video.thumbnail,
    };
  }

  return {
    addMultipleResources: (thumbnailsToAdd: Thumbnail[]) =>
      set(addMultipleResources(get(), ModelName.THUMBNAILS, thumbnailsToAdd)),
    addResource: (thumbnail: Thumbnail) =>
      set(addResource<Thumbnail>(get(), ModelName.THUMBNAILS, thumbnail)),
    getThumbnail: () => {
      if (Object.keys(get()[ModelName.THUMBNAILS]).length > 0) {
        const thumbnailId = Object.keys(get()[ModelName.THUMBNAILS]).shift();
        return get()[ModelName.THUMBNAILS][thumbnailId!];
      }

      return null;
    },
    removeResource: (thumbnail: Thumbnail) =>
      set(removeResource(get(), ModelName.THUMBNAILS, thumbnail)),
    [ModelName.THUMBNAILS]: thumbnails,
  };
});
