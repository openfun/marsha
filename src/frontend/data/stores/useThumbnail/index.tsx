import create from 'zustand';

import { modelName } from '../../../types/models';
import { StoreState } from '../../../types/stores';
import { Thumbnail } from '../../../types/tracks';
import { Nullable } from '../../../utils/types';
import { appData } from '../../appData';
import { addMultipleResources, addResource, removeResource } from '../actions';

type ThumbnailStateResource = {
  [modelName.THUMBNAILS]: {
    [id: string]: Thumbnail;
  };
};

type ThumbnailState = StoreState<Thumbnail> &
  ThumbnailStateResource & {
    getThumbnail: () => Nullable<Thumbnail>;
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
      set(
        addMultipleResources(
          get(),
          modelName.THUMBNAILS,
          thumbnailsToAdd,
        ) as ThumbnailStateResource,
      ),
    addResource: (thumbnail: Thumbnail) =>
      set(
        addResource<Thumbnail>(
          get(),
          modelName.THUMBNAILS,
          thumbnail,
        ) as ThumbnailStateResource,
      ),
    getThumbnail: () => {
      if (Object.keys(get()[modelName.THUMBNAILS]).length > 0) {
        const thumbnailId = Object.keys(get()[modelName.THUMBNAILS]).shift();
        return get()[modelName.THUMBNAILS][thumbnailId!];
      }

      return null;
    },
    removeResource: (thumbnail: Thumbnail) =>
      set(
        removeResource(
          get(),
          modelName.THUMBNAILS,
          thumbnail,
        ) as ThumbnailStateResource,
      ),
    [modelName.THUMBNAILS]: thumbnails,
  };
});
