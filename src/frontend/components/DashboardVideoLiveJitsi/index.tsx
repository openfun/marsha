import { Box } from 'grommet';
import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { DashboardVideoLiveInfo } from '../DashboardVideoLiveInfo';
import { useParticipantWorkflow } from '../../data/stores/useParticipantWorkflow';
import { Video, liveState } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { converse } from '../../utils/window';
import { PLAYER_ROUTE } from '../routes';
import { modelName } from '../../types/models';

interface DashboardVideoLiveJitsiProps {
  setCanStartLive?: undefined;
  setCanShowStartButton?: undefined;
  video: Video;
  isInstructor?: false;
}

interface DashboardVideoLiveJitsiInstructorProps {
  setCanStartLive: (canStartLive: boolean) => void;
  setCanShowStartButton: (canShowStartButton: boolean) => void;
  video: Video;
  isInstructor: true;
}

const DashboardVideoLiveJitsi = ({
  setCanStartLive = () => undefined,
  setCanShowStartButton = () => undefined,
  video,
  isInstructor = false,
}: DashboardVideoLiveJitsiProps | DashboardVideoLiveJitsiInstructorProps) => {
  const jitsiNode = useRef(null);
  const [jitsi, setJitsi] = useState<JitsiMeetExternalAPI>();
  const jitsiIsRecording = useRef(false);
  const endpoints = useRef<string[]>();
  const retryDelayStep = 2000;
  const retryStartRecordingDelay = useRef(retryDelayStep);
  const reset = useParticipantWorkflow((state) => state.reset);
  const history = useHistory();

  const loadJitsiScript = () =>
    new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = video.live_info.jitsi!.external_api_url!;
      script.async = true;
      script.onload = resolve;
      document.body.appendChild(script);
    });

  const startRecording = (jitsiApi: JitsiMeetExternalAPI) => {
    if (!isInstructor || jitsiIsRecording.current) {
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
      'fullscreen',
      'fodeviceselection',
      'hangup',
      'profile',
      'settings',
      'raisehand',
      'videoquality',
      'filmstrip',
      'feedback',
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
          // Controls the visibility and behavior of the top header conference info labels.
          // If a label's id is not in any of the 2 arrays, it will not be visible at all on the header.
          conferenceInfo: {
            // those labels will not be hidden in tandem with the toolbox.
            alwaysVisible: [
              'recording',
              // 'local-recording'
            ],
            // those labels will be auto-hidden in tandem with the toolbox buttons.
            autoHide: [
              // 'subject',
              // 'conference-timer',
              // 'participants-count',
              // 'e2ee',
              // 'transcribing',
              // 'video-quality',
              // 'insecure-room'
            ],
          },
          disablePolls: true,
          // Disables storing the room name to the recents list
          doNotStoreRoom: true,
          // Hides the conference subject
          hideConferenceSubject: true,
          // Hides the conference timer.
          hideConferenceTimer: true,
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
        await new Promise((resolve) =>
          window.setTimeout(resolve, retryStartRecordingDelay.current),
        );
        if (retryStartRecordingDelay.current < 20000)
          retryStartRecordingDelay.current += retryDelayStep;
        startRecording(_jitsi);
      }

      // recording has started. Reset the retry delay
      if (event.on) {
        retryStartRecordingDelay.current = retryDelayStep;
      }
    });

    if (!isInstructor) {
      _jitsi.addListener('videoConferenceLeft', () => {
        _jitsi.dispose();
        converse.participantLeaves();
        reset();
        history.push(PLAYER_ROUTE(modelName.VIDEOS));
      });
    }

    if (isInstructor) {
      _jitsi.addListener('participantRoleChanged', (event) => {
        if (event.role === 'moderator') {
          setCanStartLive(true);
        } else {
          setCanStartLive(false);
        }
      });

      _jitsi.addListener('videoConferenceJoined', () => {
        setCanShowStartButton(true);
      });

      _jitsi.addListener('videoConferenceLeft', () => {
        setCanStartLive(false);
        setCanShowStartButton(false);
      });
    }

    if (video.live_state === liveState.RUNNING) {
      startRecording(_jitsi);
    }

    setJitsi(_jitsi);
  };

  useEffect(() => {
    if (isInstructor) {
      const endpointIdentifier = /^(rtmp:\/\/.*)\/(.*)$/;
      endpoints.current = video.live_info.medialive!.input.endpoints.map(
        (endpoint) => {
          const matches = endpoint.match(endpointIdentifier)!;
          return `${matches[1]}/marsha/${matches[2]}`;
        },
      ) as string[];
    }
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

  return (
    <Box>
      <Box height={'large'} ref={jitsiNode} />
      {isInstructor && (
        <Box justify="start" direction="row">
          <DashboardVideoLiveInfo video={video} />
        </Box>
      )}
    </Box>
  );
};

export default DashboardVideoLiveJitsi;
