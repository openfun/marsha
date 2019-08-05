import create from 'zustand';

import { modelName } from '../../../types/models';
import { StoreState } from '../../../types/stores';
import { Thumbnail } from '../../../types/tracks';
import { Nullable } from '../../../utils/types';
import { appData } from '../../appData';
import { addMultipleResources, addResource, removeResource } from '../actions';

interface ThumbnailState extends StoreState<Thumbnail> {
  getThumbnail: () => Nullable<Thumbnail>;
  [modelName.THUMBNAIL]: {
    [id: string]: Thumbnail;
  };
}

export const [useThumbnail, useThumbnailApi] = create<ThumbnailState>(
  (set, get) => {
    let thumbnails = {};

    if (appData.video && appData.video.thumbnail !== null) {
      thumbnails = {
        [appData.video.thumbnail.id]: appData.video.thumbnail,
      };
    }

    return {
      addMultipleResources: (thumbnailsToAdd: Thumbnail[]) =>
        set(addMultipleResources(get(), modelName.THUMBNAIL, thumbnailsToAdd)),
      addResource: (thumbnail: Thumbnail) =>
        set(addResource<Thumbnail>(get(), modelName.THUMBNAIL, thumbnail)),
      getThumbnail: () => {
        if (get()[modelName.THUMBNAIL]) {
          const thumbnailId = Object.keys(get()[modelName.THUMBNAIL]).shift();
          return get()[modelName.THUMBNAIL][thumbnailId!];
        }

        return null;
      },
      removeResource: (thumbnail: Thumbnail) =>
        set(removeResource(get(), modelName.THUMBNAIL, thumbnail)),
      [modelName.THUMBNAIL]: thumbnails,
    };
  },
);
