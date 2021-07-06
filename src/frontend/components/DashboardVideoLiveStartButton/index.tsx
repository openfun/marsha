import React, { useCallback, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { startLive } from '../../data/sideEffects/startLive';
import { useVideo } from '../../data/stores/useVideo';
import { Video } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { DashboardConfirmButton } from '../DashboardConfirmButton';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { Loader } from '../Loader';

const messages = defineMessages({
  startLive: {
    defaultMessage: 'start streaming',
    description: 'Start a video streaming.',
    id: 'components.DashboardVideoLive.startLive',
  },
  confirmStartLive: {
    defaultMessage: 'Are you sure you want to start a video streaming ?',
    description: 'Confirmation to start a video streaming.',
    id: 'components.DashboardVideoLive.confirmStartLive',
  },
});

type startLiveStatus = 'pending' | 'error';

interface DashboardVideoLiveStartButtonProps {
  video: Video;
}

export const DashboardVideoLiveStartButton = ({
  video,
}: DashboardVideoLiveStartButtonProps) => {
  const [status, setStatus] = useState<Nullable<startLiveStatus>>(null);
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));

  const startLiveAction = useCallback(async () => {
    setStatus('pending');
    try {
      const updatedVideo = await startLive(video);
      updateVideo(updatedVideo);
    } catch (error) {
      setStatus('error');
    }
  }, [video]);

  if (status === 'error') {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('liveInit')} />;
  }

  return (
    <React.Fragment>
      {status === 'pending' && <Loader />}
      <DashboardConfirmButton
        label={<FormattedMessage {...messages.startLive} />}
        confirmationLabel={<FormattedMessage {...messages.confirmStartLive} />}
        onConfirm={startLiveAction}
      />
    </React.Fragment>
  );
};
