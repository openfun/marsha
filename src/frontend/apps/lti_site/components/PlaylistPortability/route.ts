import { modelName } from 'lib-components';

/**
 * Route for the `<PlaylistPortabilityProps />` component.
 * @param objectType The model name for the object for which we're uploading a file.
 */
export const PLAYLIST_ROUTE = (objectType?: modelName) => {
  if (objectType) {
    return `/playlist/${objectType}`;
  }

  return `/playlist/:objectType(${modelName.VIDEOS}|${modelName.DOCUMENTS})`;
};
