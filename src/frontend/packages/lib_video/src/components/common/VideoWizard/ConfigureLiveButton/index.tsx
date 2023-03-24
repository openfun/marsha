import { Button } from 'grommet';
import { Nullable } from 'lib-common';
import { Loader, useVideo, LiveModeType, Video } from 'lib-components';
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
      {status === 'pending' && <Loader />}
      <Button
        a11yTitle={intl.formatMessage(messages.startLiveButtonLabel)}
        fill="horizontal"
        label={intl.formatMessage(messages.startLiveButtonLabel)}
        onClick={() => void configureLive()}
        primary
        style={{ minHeight: '50px', fontFamily: 'Roboto-Medium' }}
        title={intl.formatMessage(messages.startLiveButtonLabel)}
      />
    </React.Fragment>
  );
};
