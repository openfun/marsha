import { Nullable } from 'lib-common';
import { create } from 'zustand';

import {
  addMultipleResources,
  addResource,
  removeResource,
} from 'data/stores/actions';
import { modelName } from 'types/models';
import { StoreState } from 'types/stores';
import { Thumbnail } from 'types/tracks';

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
        const thumbnailId = Object.keys(
          get()[modelName.THUMBNAILS],
        ).shift() as string;
        return get()[modelName.THUMBNAILS][thumbnailId];
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
    [modelName.THUMBNAILS]: {},
  };
});
