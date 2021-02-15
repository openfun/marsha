import React, { useCallback, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { startLive } from '../../data/sideEffects/startLive';
import { useVideo } from '../../data/stores/useVideo';
import { Video } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { DashboardButton } from '../DashboardPaneButtons';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { Loader } from '../Loader';

const messages = defineMessages({
  startLive: {
    defaultMessage: 'start streaming',
    description: 'Start a video streaming.',
    id: 'components.DashboardVideoLive.startLive',
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
      <DashboardButton
        label={<FormattedMessage {...messages.startLive} />}
        primary={true}
        onClick={startLiveAction}
      />
    </React.Fragment>
  );
};
