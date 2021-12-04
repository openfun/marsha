import React, { useCallback, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Navigate } from 'react-router-dom';

import { endLive } from '../../data/sideEffects/endLive';
import { useVideo } from '../../data/stores/useVideo';
import { Video } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { DashboardConfirmButton } from '../DashboardConfirmButton';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { Loader } from '../Loader';

const messages = defineMessages({
  endLive: {
    defaultMessage: 'End live',
    description: 'End a video streaming.',
    id: 'components.DashboardVideoLiveEndButton.endLive',
  },
  confirmEndLive: {
    defaultMessage:
      'Are you sure you want to end the video streaming ? This action is definitive',
    description: 'Confirmation to end the video streaming.',
    id: 'components.DashboardVideoLiveEndButton.confirmEndLive',
  },
});

type endLiveStatus = 'pending' | 'error';

interface DashboardVideoLiveEndButtonProps {
  video: Video;
}

export const DashboardVideoLiveEndButton = ({
  video,
}: DashboardVideoLiveEndButtonProps) => {
  const [status, setStatus] = useState<Nullable<endLiveStatus>>(null);
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));

  const endLiveAction = useCallback(async () => {
    setStatus('pending');
    try {
      const updatedVideo = await endLive(video);
      updateVideo(updatedVideo);
    } catch (error) {
      setStatus('error');
    }
  }, [video]);

  if (status === 'error') {
    return <Navigate to={FULL_SCREEN_ERROR_ROUTE('liveInit')} />;
  }

  return (
    <React.Fragment>
      {status === 'pending' && <Loader />}
      <DashboardConfirmButton
        label={<FormattedMessage {...messages.endLive} />}
        confirmationLabel={<FormattedMessage {...messages.confirmEndLive} />}
        onConfirm={endLiveAction}
      />
    </React.Fragment>
  );
};
