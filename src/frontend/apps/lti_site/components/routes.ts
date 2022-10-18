import { modelName } from 'lib-components';

/**
 * Route for the player component.
 * @param objectType The model name for the object we want to show
 */
export const PLAYER_ROUTE = (
  objectType?: modelName.VIDEOS | modelName.DOCUMENTS,
) => {
  if (objectType) {
    return `/player/${objectType}`;
  }

  return `/player/:objectType(${modelName.VIDEOS}|${modelName.DOCUMENTS})`;
};

export enum VideoWizzardSubPage {
  createVideo = 'create_vod',
}

export const VIDEO_WIZARD_ROUTE = (subPage?: VideoWizzardSubPage) => {
  return `/video_wizzard${subPage ? '/' + subPage : ''}`;
};
