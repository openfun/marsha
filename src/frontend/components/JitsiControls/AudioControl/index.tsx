import { Box, Button } from 'grommet';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { MicrophoneOffSVG } from 'components/SVGIcons/MicrophoneOffSVG';
import { MicrophoneOnSVG } from 'components/SVGIcons/MicrophoneOnSVG';
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

export const AudioControl = () => {
  const [jitsiApi] = useJitsiApi();
  const [isAudioOn, setIsAudioOn] = useState<Nullable<boolean>>(null);
  const handleAudioSwitch = useCallback(({ muted }: { muted: boolean }) => {
    setIsAudioOn(!muted);
  }, []);

  useEffect(() => {
    if (!jitsiApi) {
      setIsAudioOn(null);
      return;
    }

    let canceled = false;
    jitsiApi.isAudioMuted().then((isOn) => {
      if (canceled) {
        return;
      }

      setIsAudioOn(isOn);
    });

    jitsiApi.addListener('audioMuteStatusChanged', handleAudioSwitch);

    return () => {
      canceled = true;

      jitsiApi.removeListener('audioMuteStatusChanged', handleAudioSwitch);
    };
  }, [jitsiApi, handleAudioSwitch]);

  if (isAudioOn === null) {
    return <Fragment />;
  }

  return (
    <StyledButton
      plain
      label={
        <ContainerStyle>
          {isAudioOn ? (
            <MicrophoneOnSVG iconColor="white" height="100%" width="100%" />
          ) : (
            <MicrophoneOffSVG iconColor="white" height="100%" width="100%" />
          )}
        </ContainerStyle>
      }
      onClick={() => {
        if (!jitsiApi) {
          return;
        }

        jitsiApi.executeCommand('toggleAudio');
      }}
    />
  );
};
