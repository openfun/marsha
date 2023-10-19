import { Button } from '@openfun/cunningham-react';
import { Nullable } from 'lib-common';
import { BoxLoader, LiveModeType, Video, useVideo } from 'lib-components';
import React, { ReactElement, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { initiateLive } from '@lib-video/api/initiateLive';

const messages = defineMessages({
  startLiveButtonLabel: {
    defaultMessage: 'Start a live',
    description: 'Label of the button used for creating a new live.',
    id: 'components.DashboardVideoLiveConfigureButtons.startLiveButtonLabel',
  },
});

type configureLiveStatus = 'pending' | 'success' | 'error';

interface ConfigureLiveButtonProps {
  video: Video;
  RenderOnSuccess: ReactElement;
  RenderOnError: ReactElement;
}

export const ConfigureLiveButton = ({
  video,
  RenderOnSuccess,
  RenderOnError,
}: ConfigureLiveButtonProps) => {
  const [status, setStatus] = useState<Nullable<configureLiveStatus>>(null);
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));
  const intl = useIntl();

  const configureLive = async () => {
    setStatus('pending');
    try {
      const updatedVideo = await initiateLive(video, LiveModeType.JITSI);
      setStatus('success');
      updateVideo(updatedVideo);
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return RenderOnSuccess;
  }

  if (status === 'error') {
    return RenderOnError;
  }

  return (
    <React.Fragment>
      {status === 'pending' && <BoxLoader />}
      <Button
        fullWidth
        aria-label={intl.formatMessage(messages.startLiveButtonLabel)}
        onClick={() => void configureLive()}
        title={intl.formatMessage(messages.startLiveButtonLabel)}
      >
        {intl.formatMessage(messages.startLiveButtonLabel)}
      </Button>
    </React.Fragment>
  );
};
