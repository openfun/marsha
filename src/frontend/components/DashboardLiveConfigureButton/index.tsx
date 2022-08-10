import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { DashboardButtonBeta } from 'components/common/dashboard/DashboardButtons';
import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { Loader } from 'components/Loader';
import { initiateLive } from 'data/sideEffects/initiateLive';
import { updateResource } from 'data/sideEffects/updateResource';
import { useVideo } from 'data/stores/useVideo';
import { modelName } from 'types/models';
import { LiveModeType, Video } from 'types/tracks';
import { Nullable } from 'utils/types';

const messages = defineMessages({
  raw: {
    defaultMessage: 'Configure a live streaming',
    description: 'Dashboard button to configure a live streaming',
    id: 'components.Dashboard.DashboardPaneButtons.videos.raw',
  },
  jitsi: {
    defaultMessage: 'Create a webinar',
    description: 'Dashboard button to create a webinar',
    id: 'components.Dashboard.DashboardPaneButtons.videos.jitsi',
  },
});

type configureLiveStatus = 'pending' | 'success' | 'error';

/** Props shape for the DashboardLiveConfigureButton component. */
export interface DashboardLiveConfigureButtonProps {
  video: Video;
  type: LiveModeType;
}

export const DashboardLiveConfigureButton = ({
  video,
  type,
}: DashboardLiveConfigureButtonProps) => {
  const [status, setStatus] = useState<Nullable<configureLiveStatus>>(null);
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));

  const configureLive = async () => {
    setStatus('pending');
    try {
      const updatedVideo =
        video.live_state !== null
          ? await updateResource(
              {
                ...video,
                live_type: type,
              },
              modelName.VIDEOS,
            )
          : await initiateLive(video, type);
      setStatus('success');
      updateVideo(updatedVideo);
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return <Redirect push to={DASHBOARD_ROUTE(modelName.VIDEOS)} />;
  }

  if (status === 'error') {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('liveInit')} />;
  }

  return (
    <React.Fragment>
      {status === 'pending' && <Loader />}

      <DashboardButtonBeta
        onClick={configureLive}
        label={<FormattedMessage {...messages[type]} />}
      />
    </React.Fragment>
  );
};
