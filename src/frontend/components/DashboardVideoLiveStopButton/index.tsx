import React, { useCallback, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { stopLive } from '../../data/sideEffects/stopLive';
import { useVideo } from '../../data/stores/useVideo';
import { Video } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { DashboardButton } from '../DashboardPaneButtons';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { Loader } from '../Loader';

const messages = defineMessages({
  stopLive: {
    defaultMessage: 'stop streaming',
    description: 'Stop a video streaming.',
    id: 'components.DashboardVideoLiveStopButton.startLive',
  },
});

type stopLiveStatus = 'pending' | 'error';

interface DashboardVideoLiveStartButtonProps {
  video: Video;
  jitsi?: JitsiMeetExternalAPI;
}

export const DashboardVideoLiveStopButton = ({
  jitsi,
  video,
}: DashboardVideoLiveStartButtonProps) => {
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
      <DashboardButton
        label={<FormattedMessage {...messages.stopLive} />}
        primary={true}
        onClick={stopLiveAction}
      />
    </React.Fragment>
  );
};
