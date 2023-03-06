import {
  useCurrentResourceContext,
  FULL_SCREEN_ERROR_ROUTE,
  modelName,
  uploadState,
  Video,
} from 'lib-components';
import React from 'react';
import { Redirect } from 'react-router-dom';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import {
  PLAYER_ROUTE,
  VideoWizzardSubPage,
  VIDEO_WIZARD_ROUTE,
} from 'components/routes';

interface RedirectVideoProps {
  video: Video;
}

export const RedirectVideo = ({ video }: RedirectVideoProps) => {
  const [context] = useCurrentResourceContext();

  if (video.upload_state === uploadState.DELETED) {
    // A deleted video cannot be used
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('videoDeleted')} />;
  }

  if (
    (video.live_type ||
      video.is_ready_to_show ||
      video.upload_state === uploadState.PROCESSING) &&
    context.permissions.can_update
  ) {
    //  teacher can access live dashboard
    return <Redirect push to={DASHBOARD_ROUTE(modelName.VIDEOS)} />;
  }

  if (context.permissions.can_update) {
    //  teacher access video wizzard
    return (
      <Redirect
        push
        to={VIDEO_WIZARD_ROUTE(
          video.upload_state === uploadState.INITIALIZED
            ? VideoWizzardSubPage.createVideo
            : undefined,
        )}
      />
    );
  }

  if (video.is_ready_to_show) {
    return <Redirect push to={PLAYER_ROUTE(modelName.VIDEOS)} />;
  }

  if (video.starting_at) {
    // user can register to the scheduled event
    return <Redirect push to={PLAYER_ROUTE(modelName.VIDEOS)} />;
  }

  // For safety default to the 404 view: this is for users without update permission
  // when the video is not live and not ready to show,
  return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
};
