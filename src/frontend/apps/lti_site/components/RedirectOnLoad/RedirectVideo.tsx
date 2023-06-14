import {
  ErrorComponents,
  Video,
  builderDashboardRoute,
  builderFullScreenErrorRoute,
  modelName,
  uploadState,
  useCurrentResourceContext,
} from 'lib-components';
import { Navigate } from 'react-router-dom';

import {
  VideoWizzardSubPage,
  builderPlayerRoute,
  builderVideoWizzardRoute,
} from 'components/routes';

interface RedirectVideoProps {
  video: Video;
}

export const RedirectVideo = ({ video }: RedirectVideoProps) => {
  const [context] = useCurrentResourceContext();

  if (video.upload_state === uploadState.DELETED) {
    // A deleted video cannot be used
    return (
      <Navigate
        to={builderFullScreenErrorRoute(ErrorComponents.videoDeleted)}
      />
    );
  }

  if (
    (video.live_type ||
      video.is_ready_to_show ||
      video.upload_state === uploadState.PROCESSING) &&
    context.permissions.can_update
  ) {
    //  teacher can access live dashboard
    return <Navigate to={builderDashboardRoute(modelName.VIDEOS)} />;
  }

  if (context.permissions.can_update) {
    //  teacher access video wizzard
    return (
      <Navigate
        to={builderVideoWizzardRoute(
          video.upload_state === uploadState.INITIALIZED
            ? VideoWizzardSubPage.createVideo
            : undefined,
        )}
      />
    );
  }

  if (video.is_ready_to_show) {
    return <Navigate to={builderPlayerRoute(modelName.VIDEOS)} />;
  }

  if (video.starting_at) {
    // user can register to the scheduled event
    return <Navigate to={builderPlayerRoute(modelName.VIDEOS)} />;
  }

  // For safety default to the 404 view: this is for users without update permission
  // when the video is not live and not ready to show,
  return (
    <Navigate to={builderFullScreenErrorRoute(ErrorComponents.notFound)} />
  );
};
