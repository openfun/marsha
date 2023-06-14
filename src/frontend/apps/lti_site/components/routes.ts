import { modelName } from 'lib-components';

/**
 * Route for the player component.
 * @param objectType The model name for the object we want to show
 */
export const PLAYER_ROUTE = {
  base: 'player',
  all: 'player/*',
  videos: modelName.VIDEOS,
  documents: modelName.DOCUMENTS,
};

export const builderPlayerRoute = (
  objectType?: modelName.VIDEOS | modelName.DOCUMENTS,
) => {
  return `/${PLAYER_ROUTE.base}/${objectType || ''}`;
};

export enum VideoWizzardSubPage {
  createVideo = 'create_vod',
}

export const VIDEO_WIZARD_ROUTE = {
  base: 'video_wizzard',
  all: 'video_wizzard/*',
  ...VideoWizzardSubPage,
};

export const builderVideoWizzardRoute = (subPage?: VideoWizzardSubPage) => {
  return `/${VIDEO_WIZARD_ROUTE.base}${subPage ? '/' + subPage : ''}`;
};
