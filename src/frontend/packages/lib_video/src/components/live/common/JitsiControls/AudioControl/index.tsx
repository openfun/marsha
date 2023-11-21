import { Nullable } from 'lib-common';
import { MicrophoneOffSVG, MicrophoneOnSVG } from 'lib-components';
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

  const style = {
    maxHeight: '35px',
    maxWidth: '35px',
    width: '100%',
    height: '100%',
  };

  if (isAudioOn) {
    return (
      <MicrophoneOnSVG
        iconColor="white"
        aria-label={intl.formatMessage(messages.enableTitle)}
        style={style}
        onClick={() => {
          if (!jitsiApi) {
            return;
          }

          jitsiApi.executeCommand('toggleAudio');
        }}
      />
    );
  }

  return (
    <MicrophoneOffSVG
      iconColor="white"
      aria-label={intl.formatMessage(messages.disableTitle)}
      onClick={() => {
        if (!jitsiApi) {
          return;
        }

        jitsiApi.executeCommand('toggleAudio');
      }}
      style={style}
    />
  );
};
