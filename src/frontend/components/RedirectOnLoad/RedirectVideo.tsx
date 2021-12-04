import React from 'react';
import { Navigate } from 'react-router-dom';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { PLAYER_ROUTE } from 'components/routes';
import { getDecodedJwt } from 'data/appData';
import { modelName } from 'types/models';
import { SUBSCRIBE_SCHEDULED_ROUTE } from 'components/SubscribeScheduledVideo/route';
import { Video } from 'types/tracks';

interface RedirectVideoProps {
  video: Video;
}

export const RedirectVideo = ({ video }: RedirectVideoProps) => {
  if (video.live_type && getDecodedJwt().permissions.can_update) {
    return <Navigate to={DASHBOARD_ROUTE(modelName.VIDEOS)} />;
  }

  if (video.is_ready_to_show) {
    return <Navigate to={PLAYER_ROUTE(modelName.VIDEOS)} />;
  }

  if (getDecodedJwt().permissions.can_update) {
    return <Navigate to={DASHBOARD_ROUTE(modelName.VIDEOS)} />;
  }
  if (video.starting_at) {
    // user can register to the scheduled event
    return <Navigate to={SUBSCRIBE_SCHEDULED_ROUTE()} />;
  }

  // For safety default to the 404 view: this is for users without update permission
  // when the video is not live and not ready to show,
  return <Navigate to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
};
