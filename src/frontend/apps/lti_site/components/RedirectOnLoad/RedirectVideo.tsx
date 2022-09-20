import { useJwt } from 'lib-components';
import React from 'react';
import { Redirect } from 'react-router-dom';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import {
  PLAYER_ROUTE,
  VideoWizzardSubPage,
  VIDEO_WIZARD_ROUTE,
} from 'components/routes';
import { modelName } from 'types/models';
import { uploadState, Video } from 'types/tracks';

interface RedirectVideoProps {
  video: Video;
}

export const RedirectVideo = ({ video }: RedirectVideoProps) => {
  const getDecodedJwt = useJwt((state) => state.getDecodedJwt);

  if (
    (video.live_type ||
      video.is_ready_to_show ||
      video.upload_state === uploadState.PROCESSING) &&
    getDecodedJwt().permissions.can_update
  ) {
    //  teacher can access live dashboard
    return <Redirect push to={DASHBOARD_ROUTE(modelName.VIDEOS)} />;
  }

  if (getDecodedJwt().permissions.can_update) {
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
