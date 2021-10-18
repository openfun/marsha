import React from 'react';
import { Redirect } from 'react-router-dom';

import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { PLAYER_ROUTE } from '../routes';
import { getDecodedJwt } from '../../data/appData';
import { modelName } from '../../types/models';
import { Video } from '../../types/tracks';

interface RedirectVideoProps {
  video: Video;
}

export const RedirectVideo = ({ video }: RedirectVideoProps) => {
  if (video.live_type && getDecodedJwt().permissions.can_update) {
    return <Redirect push to={DASHBOARD_ROUTE(modelName.VIDEOS)} />;
  }

  if (video.is_ready_to_show) {
    return <Redirect push to={PLAYER_ROUTE(modelName.VIDEOS)} />;
  }

  if (getDecodedJwt().permissions.can_update) {
    return <Redirect push to={DASHBOARD_ROUTE(modelName.VIDEOS)} />;
  }

  // For safety default to the 404 view: this is for users without update permission
  // when the video is not live and not ready to show,
  return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
};
