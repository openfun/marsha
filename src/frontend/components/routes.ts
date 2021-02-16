import { ModelName } from '../types/models';

/**
 * Route for the player component.
 * @param objectType The model name for the object we want to show
 */
export const PLAYER_ROUTE = (
  objectType?: ModelName.VIDEOS | ModelName.DOCUMENTS,
) => {
  if (objectType) {
    return `/player/${objectType}`;
  }

  return `/player/:objectType(${ModelName.VIDEOS}|${ModelName.DOCUMENTS})`;
};
