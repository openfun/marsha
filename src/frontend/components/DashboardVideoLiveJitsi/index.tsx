import { Box } from 'grommet';
import React, { useEffect, useRef, useState } from 'react';

import { Video, liveState } from '../../types/tracks';
import { report } from '../../utils/errors/report';

interface DashboardVideoLiveJitsiProps {
  video: Video;
}

const DashboardVideoLiveJitsi = ({ video }: DashboardVideoLiveJitsiProps) => {
  const jitsiNode = useRef(null);
  const [jitsi, setJitsi] = useState<JitsiMeetExternalAPI>();
  const jitsiIsRecording = useRef(false);
  const endpoints = useRef<string[]>();

  const loadJitsiScript = () =>
    new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = video.live_info.jitsi!.external_api_url!;
      script.async = true;
      script.onload = resolve;
      document.body.appendChild(script);
    });

  const startRecording = (jitsiApi: JitsiMeetExternalAPI) => {
    if (jitsiIsRecording.current) {
      return;
    }

    jitsiApi.executeCommand('startRecording', {
      mode: 'stream',
      rtmpStreamKey: endpoints.current![0]!,
    });
    jitsiIsRecording.current = true;
  };

  const initialiseJitsi = async () => {
    if (!window.JitsiMeetExternalAPI) {
      await loadJitsiScript();
    }

    // toolbar config must be set in both configOverwrite and interfaceConfigOverwrite. This settings
    // has moved from interfaceConfigOverwrite to configOverwrite and depending the jitsi version used
    // we don't know which one to use. Settings both does not raise an error, there is no check on
    // extra settings.
    const toolbarButtons = [
      'microphone',
      'camera',
      'closedcaptions',
      'desktop',
      'embedmeeting',
      'fullscreen',
      'fodeviceselection',
      'hangup',
      'profile',
      'chat',
      'etherpad',
      'shareaudio',
      'settings',
      'raisehand',
      'videoquality',
      'filmstrip',
      'invite',
      'feedback',
      'stats',
      'shortcuts',
      'tileview',
      'select-background',
      'help',
      'mute-everyone',
      'mute-video-everyone',
      'security',
    ];

    const _jitsi = new window.JitsiMeetExternalAPI(
      video.live_info.jitsi!.domain!,
      {
        configOverwrite: {
          constraints: {
            video: {
              height: {
                ideal: 720,
                max: 720,
                min: 240,
              },
            },
          },
          resolution: 720,
          toolbarButtons,
          ...video.live_info.jitsi!.config_overwrite,
        },
        interfaceConfigOverwrite: {
          HIDE_INVITE_MORE_HEADER: true,
          TOOLBAR_BUTTONS: toolbarButtons,
          ...video.live_info.jitsi!.interface_config_overwrite,
        },
        parentNode: jitsiNode.current!,
        roomName: video.id,
      },
    );

    _jitsi.addListener('recordingStatusChanged', async (event) => {
      // recording as stopped with an error
      if (!event.on && event.error) {
        jitsiIsRecording.current = false;
        report(event.error);
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        startRecording(_jitsi);
      }
    });

    if (video.live_state === liveState.RUNNING) {
      startRecording(_jitsi);
    }

    setJitsi(_jitsi);
  };

  useEffect(() => {
    const endpointIdentifier = /^(rtmp:\/\/.*)\/(.*)$/;
    endpoints.current = video.live_info.medialive!.input.endpoints.map(
      (endpoint) => {
        const matches = endpoint.match(endpointIdentifier)!;
        return `${matches[1]}/marsha/${matches[2]}`;
      },
    ) as string[];
    initialiseJitsi();

    return () => jitsi?.dispose();
  }, []);

  useEffect(() => {
    if (jitsi && video.live_state === liveState.RUNNING) {
      startRecording(jitsi);
    }

    if (
      jitsi &&
      video.live_state === liveState.STOPPING &&
      jitsiIsRecording.current
    ) {
      jitsi.executeCommand('stopRecording', 'stream');
    }
  }, [video.live_state]);

  return <Box height={'large'} ref={jitsiNode} />;
};

export default DashboardVideoLiveJitsi;
