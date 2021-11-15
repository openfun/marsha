import React, { useCallback, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { startLive } from '../../data/sideEffects/startLive';
import { useVideo } from '../../data/stores/useVideo';
import { liveState, Video } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { DashboardConfirmButton } from '../DashboardConfirmButton';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { Loader } from '../Loader';

const messages = defineMessages({
  startLive: {
    defaultMessage: 'Start streaming',
    description: 'Start a video streaming.',
    id: 'components.DashboardVideoLiveStartButton.startLive',
  },
  confirmStartLive: {
    defaultMessage: 'Are you sure you want to start a video streaming ?',
    description: 'Confirmation to start a video streaming.',
    id: 'components.DashboardVideoLiveStartButton.confirmStartLive',
  },
  resumeLive: {
    defaultMessage: 'Resume streaming',
    description: 'Resume a video streaming.',
    id: 'components.DashboardVideoLiveStartButton.resumeLive',
  },
  confirmResumeLive: {
    defaultMessage: 'Are you sure you want to resume a video streaming ?',
    description: 'Confirmation to resume a video streaming.',
    id: 'components.DashboardVideoLiveStartButton.confirmResumeLive',
  },
  startLiveHelper: {
    defaultMessage: 'Only moderators can start a live',
    description:
      'Helper message explaining why the start live button is disabled',
    id: 'components.DashboardVideoLiveStartButton.startLiveHelper',
  },
});

type startLiveStatus = 'pending' | 'error';

interface DashboardVideoLiveStartButtonProps {
  canStartLive: boolean;
  video: Video;
}

export const DashboardVideoLiveStartButton = ({
  canStartLive,
  video,
}: DashboardVideoLiveStartButtonProps) => {
  const [status, setStatus] = useState<Nullable<startLiveStatus>>(null);
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));
  const intl = useIntl();

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
        disabled={!canStartLive}
        label={
          canStartLive
            ? intl.formatMessage(
                video.live_state === liveState.IDLE
                  ? messages.startLive
                  : messages.resumeLive,
              )
            : intl.formatMessage(messages.startLiveHelper)
        }
        confirmationLabel={intl.formatMessage(
          video.live_state === liveState.IDLE
            ? messages.confirmStartLive
            : messages.confirmResumeLive,
        )}
        onConfirm={startLiveAction}
      />
    </React.Fragment>
  );
};
