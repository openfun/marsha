import React, { useCallback, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { stopLive } from '../../data/sideEffects/stopLive';
import { useVideo } from '../../data/stores/useVideo';
import { Video } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { DashboardConfirmButton } from '../DashboardConfirmButton';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { Loader } from '../Loader';

const messages = defineMessages({
  stopLive: {
    defaultMessage: 'stop streaming',
    description: 'Stop a video streaming.',
    id: 'components.DashboardVideoLiveStopButton.startLive',
  },
  confirmStopLive: {
    defaultMessage: 'Are you sure you want to stop the video streaming ?',
    description: 'Confirmation to stop the video streaming.',
    id: 'components.DashboardVideoLiveStopButton.confirmStopLive',
  },
});

type stopLiveStatus = 'pending' | 'error';

interface DashboardVideoLiveStopButtonProps {
  video: Video;
}

export const DashboardVideoLiveStopButton = ({
  video,
}: DashboardVideoLiveStopButtonProps) => {
  const [status, setStatus] = useState<Nullable<stopLiveStatus>>(null);
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));

  const stopLiveAction = useCallback(async () => {
    setStatus('pending');
    try {
      const updatedVideo = await stopLive(video);
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
        label={<FormattedMessage {...messages.stopLive} />}
        confirmationLabel={<FormattedMessage {...messages.confirmStopLive} />}
        onConfirm={stopLiveAction}
      />
    </React.Fragment>
  );
};
