import { modelName } from 'lib-components';

/**
 * Route for the `<PlaylistPortabilityProps />` component.
 * @param objectType The model name for the object for which we're uploading a file.
 */

export const PLAYLIST_ROUTE = {
  base: 'playlist',
  all: `playlist/*`,
  objectType: ':objectType',
  videos: modelName.VIDEOS,
  documents: modelName.DOCUMENTS,
};

export const builderPlaylistRoute = (
  objectType?: modelName.VIDEOS | modelName.DOCUMENTS,
) => {
  return `/${PLAYLIST_ROUTE.base}/${objectType || ''}`;
};
