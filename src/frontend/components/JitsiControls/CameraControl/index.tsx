import { Box, Button } from 'grommet';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { CameraOffSVG } from 'components/SVGIcons/CameraOffSVG';
import { CameraOnSVG } from 'components/SVGIcons/CameraOnSVG';
import { useJitsiApi } from 'data/stores/useJitsiApi';
import { Nullable } from 'utils/types';

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
      plain
      label={
        <ContainerStyle>
          {isCameraOn ? (
            <Box data-testid="jitsi-camera-on">
              <CameraOnSVG iconColor="white" height="100%" width="100%" />
            </Box>
          ) : (
            <Box data-testid="jitsi-camera-off">
              <CameraOffSVG iconColor="white" height="100%" width="100%" />
            </Box>
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
