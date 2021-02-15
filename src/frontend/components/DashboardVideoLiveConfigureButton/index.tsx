import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { initiateLive } from '../../data/sideEffects/initiateLive';
import { useVideo } from '../../data/stores/useVideo';
import { modelName } from '../../types/models';
import { Video } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { DashboardButton } from '../DashboardPaneButtons';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { Loader } from '../Loader';

const messages = defineMessages({
  btnConfigureLive: {
    defaultMessage: 'Configure a live streaming',
    description: 'Dashboard button to configure a live streaming',
    id: 'components.Dashboard.DashboardPaneButtons.videos.btnStartLive',
  },
});

type configureLiveStatus = 'pending' | 'success' | 'error';

/** Props shape for the DashboardVideoLiveConfigureButton component. */
export interface DashboardVideoLiveConfigureButtonProps {
  video: Video;
}

export const DashboardVideoLiveConfigureButton = ({
  video,
}: DashboardVideoLiveConfigureButtonProps) => {
  const [status, setStatus] = useState<Nullable<configureLiveStatus>>(null);
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));

  const configureLive = async () => {
    setStatus('pending');
    try {
      const updatedVideo = await initiateLive(video);
      updateVideo(updatedVideo);
      setStatus('success');
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

      <DashboardButton
        onClick={configureLive}
        label={<FormattedMessage {...messages.btnConfigureLive} />}
      />
    </React.Fragment>
  );
};
