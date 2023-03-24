import { Box, Button } from 'grommet';
import { Nullable } from 'lib-common';
import { CameraOffSVG, CameraOnSVG } from 'lib-components';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useJitsiApi } from '@lib-video/hooks/useJitsiApi';

const messages = defineMessages({
  disableTitle: {
    defaultMessage: 'Show cam',
    description: 'Title for jitsi show/hide camera button when camera is off',
    id: 'JitsiControls.CameraControl.disableTitle',
  },
  enableTitle: {
    defaultMessage: 'Hide cam',
    description: 'Title for jitsi show/hide camera button when camera is on',
    id: 'JitsiControls.CameraControl.enableTitle',
  },
});

const StyledButton = styled(Button)`
  padding: 0px;
  height: 100%;
  width: 100%;
  max-height: 80px;
  max-width: 80px;
  margin: auto;
`;

const ContainerStyle = styled(Box)`
  margin: auto;
  max-height: 35px;
  max-width: 35px;
`;

export const CameraControl = () => {
  const intl = useIntl();
  const [jitsiApi] = useJitsiApi();
  const [isCameraOn, setIsCameraOn] = useState<Nullable<boolean>>(null);
  const handleCameraSwitch = useCallback(({ muted }: { muted: boolean }) => {
    setIsCameraOn(!muted);
  }, []);

  useEffect(() => {
    if (!jitsiApi) {
      setIsCameraOn(null);
      return;
    }

    let canceled = false;
    jitsiApi.isVideoMuted().then((isMuted) => {
      if (canceled) {
        return;
      }

      setIsCameraOn(!isMuted);
    });

    jitsiApi.addListener('videoMuteStatusChanged', handleCameraSwitch);

    return () => {
      canceled = true;

      jitsiApi.removeListener('videoMuteStatusChanged', handleCameraSwitch);
    };
  }, [jitsiApi, handleCameraSwitch]);

  if (isCameraOn === null) {
    return <Fragment />;
  }

  return (
    <StyledButton
      a11yTitle={intl.formatMessage(
        isCameraOn ? messages.enableTitle : messages.disableTitle,
      )}
      plain
      label={
        <ContainerStyle>
          {isCameraOn ? (
            <CameraOnSVG iconColor="white" height="100%" width="100%" />
          ) : (
            <CameraOffSVG iconColor="white" height="100%" width="100%" />
          )}
        </ContainerStyle>
      }
      onClick={() => {
        if (!jitsiApi) {
          return;
        }

        jitsiApi.executeCommand('toggleVideo');
      }}
    />
  );
};
