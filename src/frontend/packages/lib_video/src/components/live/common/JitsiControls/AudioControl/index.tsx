import { Button } from '@openfun/cunningham-react';
import { Box } from 'grommet';
import { Nullable } from 'lib-common';
import { MicrophoneOffSVG, MicrophoneOnSVG } from 'lib-components';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useJitsiApi } from '@lib-video/hooks/useJitsiApi';

const messages = defineMessages({
  disableTitle: {
    defaultMessage: 'Unmute',
    description: 'Title for jitsi mute/unmute button when audio is off',
    id: 'JitsiControls.AudioControl.disableTitle',
  },
  enableTitle: {
    defaultMessage: 'Mute',
    description: 'Title for jitsi mute/unmute button when audio is on',
    id: 'JitsiControls.AudioControl.enableTitle',
  },
});

// const StyledButton = styled(Button)`
//   padding: 0px;
//   height: 100%;
//   width: 100%;
//   max-height: 80px;
//   max-width: 80px;
//   margin: auto;
// `;

const ContainerStyle = styled(Box)`
  margin: auto;
  max-height: 35px;
  max-width: 35px;
`;

export const AudioControl = () => {
  const intl = useIntl();
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
    jitsiApi.isAudioMuted().then((isMuted) => {
      if (canceled) {
        return;
      }

      setIsAudioOn(!isMuted);
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
    <Button
      className="c__button-no-bg"
      aria-label={intl.formatMessage(
        isAudioOn ? messages.enableTitle : messages.disableTitle,
      )}
      color="tertiary"
      icon={
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
