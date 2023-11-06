import { Button } from '@openfun/cunningham-react';
import { Nullable } from 'lib-common';
import { Box, MicrophoneOffSVG, MicrophoneOnSVG } from 'lib-components';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

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
        <Box margin="auto" height={{ max: '35px' }} width={{ max: '35px' }}>
          {isAudioOn ? (
            <MicrophoneOnSVG iconColor="white" height="100%" width="100%" />
          ) : (
            <MicrophoneOffSVG iconColor="white" height="100%" width="100%" />
          )}
        </Box>
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
